import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";
import { env } from "../src/config/env.js";

// Conectar a la DB
mongoose.connect(env.MONGODB_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("Error conectando a MongoDB:", err));

const email = process.argv[2];

if (!email) {
  console.log("Por favor proporciona un email. Ejemplo: node scripts/simulate-subscription.js usuario@ejemplo.com");
  process.exit(1);
}

async function simulateSubscription() {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`Usuario con email ${email} no encontrado.`);
      process.exit(1);
    }

    // Simular datos de Stripe
    user.stripeCustomerId = "cus_simulated_" + Math.random().toString(36).substring(7);
    user.stripeSubscriptionId = "sub_simulated_" + Math.random().toString(36).substring(7);
    user.subscriptionStatus = "active";
    // 3 meses desde hoy
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    user.currentPeriodEnd = threeMonthsFromNow;
    user.promoUsed = true;

    await user.save();

    console.log(`✅ Suscripción ACTIVADA simulada para ${user.name} (${user.email})`);
    console.log(`Estado: active`);
    console.log(`Vence: ${user.currentPeriodEnd}`);
    console.log("Ahora deberías tener acceso completo a la app.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

simulateSubscription();
