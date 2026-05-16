import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

const getStripe = () => {
  if (!stripe) throw new HttpError(500, "Stripe no configurado");
  return stripe;
};

const getMonthlyPriceId = () => {
  if (!env.STRIPE_PRICE_ID_MONTHLY) {
    throw new HttpError(500, "Precio mensual de Stripe no configurado");
  }
  return env.STRIPE_PRICE_ID_MONTHLY;
};

export const createCheckoutSession = async (req, res, next) => {
  try {
    const stripeClient = getStripe();
    const user = await User.findById(req.user._id);
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    let customerId = user.stripeCustomerId;

    // Si no tiene customerId, crearlo
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: getMonthlyPriceId(),
          quantity: 1
        },
      ],
      subscription_data: {
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
    const stripeClient = getStripe();
    const user = await User.findById(req.user._id);
    if (!user || !user.stripeCustomerId) {
      throw new HttpError(400, "No tienes suscripción activa para gestionar");
    }

    const session = await stripeClient.billingPortal.sessions.create({
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
    const stripeClient = getStripe();
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new HttpError(500, "Stripe no configurado");
    }
    // req.body debe ser RAW buffer
    event = stripeClient.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).send(`Webhook Error: ${err.message}`);
    }
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
