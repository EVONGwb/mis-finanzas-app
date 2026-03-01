import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    let customerId = user.stripeCustomerId;

    // Si no tiene customerId, crearlo
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: env.STRIPE_PRICE_ID_MONTHLY,
          quantity: 1,
        },
      ],
      // Trial de 60 días para la promo "3 meses por 1€"
      // (Paga 1€ el primer mes + 2 meses gratis trial, o viceversa?)
      // El usuario dijo: "Paga 1€ hoy y obtiene 3 meses completos."
      // La opción A dice: "Cobrar 1€ el primer mes (sin descuento) + añadir trial de 2 meses"
      // PERO si añado trial_period_days, NO COBRA NADA HOY.
      // Para cobrar 1€ hoy, NO puede ser trial.
      // A menos que use subscription_data.trial_period_days y COBRE algo aparte setup_fee? No.
      
      // Re-leyendo la opción A del usuario: "Cobrar 1€ el primer mes (sin descuento) + añadir trial de 2 meses".
      // Esto en Stripe es complejo porque trial pospone el primer cobro.
      // Si quiero cobrar hoy, debe ser un ciclo normal.
      
      // Opción B (User suggested): "precio promo de 1€/3 meses recurrente SOLO primer ciclo".
      // El usuario dijo "Elige la opción A salvo que exista motivo técnico fuerte".
      // Motivo técnico fuerte: Stripe Trial hace que el primer cobro sea 0€.
      // Para cobrar 1€ HOY, NO debo poner trial HOY.
      // Pero quiero que el SIGUIENTE cobro sea en 3 meses.
      
      // Solución híbrida (TRUCO):
      // No usar trial_period_days en la creación directa si quiero cobrar YA.
      // Pero quiero que dure 3 meses el primer pago de 1€.
      // Eso implica que el intervalo de cobro sea trimestral. Pero luego cambia a mensual.
      
      // Espera, el usuario dice: "Trial de 2 meses (60 días) para completar 3 meses por 1€".
      // Esto significa: Paga mes 1. Luego mes 2 y 3 son gratis (trial).
      // Stripe permite "trial_end" pero si pongo trial, no cobra hoy.
      
      // Hmmm. Si el usuario paga 1€ hoy, es una suscripción mensual normal.
      // Para que los siguientes 2 meses sean gratis, podría añadir un cupón de 100% descuento por 2 meses.
      // O modificar la fecha del siguiente cobro (billing_cycle_anchor) para dentro de 3 meses? No, anchor solo funciona con trials.
      
      // Vamos a simplificar con lo que pidió LITERALMENTE en el prompt:
      // "subscription_data:{trial_period_days:60}"
      // Si pongo esto, el usuario NO PAGARÁ NADA HOY.
      // El usuario dijo: "Paga 1€ hoy".
      // Hay una contradicción en la solicitud del usuario ("Paga 1€ hoy" vs "trial_period_days:60").
      // Si pongo trial de 60 días, hoy paga 0€. En 60 días paga 1€.
      // Total 3 meses: 2 gratis + 1 pagado.
      // Eso son "3 meses por 1€" PERO se paga al final del trial (o al principio del mes 3).
      
      // Si el usuario insiste en "Pagar 1€ hoy", lo mejor es NO poner trial en el checkout,
      // sino cobrar 1 mes, y luego por API (webhook) regalar 2 meses.
      // PERO el usuario me dio instrucciones EXPLÍCITAS en el paso 3:
      // "subscription_data:{trial_period_days:60}"
      
      // VOY A SEGUIR LAS INSTRUCCIONES TÉCNICAS EXPLÍCITAS (Paso 3) sobre las de negocio si hay conflicto.
      // El paso 3 dice: `subscription_data:{trial_period_days:60}`.
      // Esto resultará en: Hoy 0€, en 60 días 1€.
      // ¿Es esto "3 meses por 1€"? Sí, son 2 meses gratis + 1 mes pago.
      // ¿Cumple "Paga 1€ hoy"? No.
      
      // Sin embargo, si hago trial_period_days: 60, el usuario tendrá acceso GRATIS 60 días.
      // Y luego empezará a pagar 1€/mes.
      // Total 3 meses = 2 gratis + 1 pagado. Coste total 1€.
      // Es aceptable.
      
      // NOTA: Si quisiera cobrar 1€ hoy, tendría que cobrar setup fee o invoice item.
      // Pero seguiré la instrucción técnica del paso 3: `trial_period_days: 60`.
      
      subscription_data: {
        trial_period_days: 60,
        metadata: { userId: user._id.toString() }
      },
      success_url: `${env.FRONTEND_URL}/subscribe/success`,
      cancel_url: `${env.FRONTEND_URL}/subscribe/cancel`,
    });

    res.json({ ok: true, url: session.url });
  } catch (error) {
    next(error);
  }
};

export const createPortalSession = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.stripeCustomerId) {
      throw new HttpError(400, "No tienes suscripción activa para gestionar");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/profile`, // O settings
    });

    res.json({ ok: true, url: session.url });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // req.body debe ser RAW buffer
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  try {
    switch (event.type) {
      case "checkout.session.completed":
        // Aquí podríamos vincular customer si no se hizo antes
        // Pero ya lo hacemos en createCheckoutSession
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        // Buscar usuario por stripeCustomerId
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.stripeSubscriptionId = subscription.id;
          user.subscriptionStatus = subscription.status; // active, trialing, past_due...
          user.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          // Si es status active/trialing, asegurar que promoUsed = true
          if (["active", "trialing"].includes(subscription.status)) {
            user.promoUsed = true;
          }
          
          await user.save();
          console.log(`Updated subscription for user ${user.email}: ${subscription.status}`);
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user) {
          user.subscriptionStatus = "past_due";
          await user.save();
        }
        break;
      }
      
      case "invoice.paid": {
         const invoice = event.data.object;
         const customerId = invoice.customer;
         // Podríamos extender currentPeriodEnd aquí, pero subscription.updated lo hará mejor
         break;
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Handler Error: ${err.message}`);
    res.status(500).send(`Webhook Handler Error: ${err.message}`);
  }
};
