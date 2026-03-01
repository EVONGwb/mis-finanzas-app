import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";
import { env } from "../src/config/env.js";

// Cargar variables de entorno si no están cargadas (útil para ejecución local directa)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function grantFreeAccessToExistingUsers() {
  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  
  if (!uri) {
    console.error("❌ MONGODB_URI no encontrada en .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB");

    // Fecha límite: 3 meses desde hoy
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    // Buscar usuarios que NO tengan suscripción activa (o que sea null/inactive)
    // Asumimos que "usuarios antiguos" son aquellos creados antes de HOY (o de una fecha específica).
    // O simplemente aplicamos a TODOS los usuarios actuales que no tengan suscripción.
    
    // Filtro: Usuarios sin subscriptionStatus 'active' o 'trialing'
    const filter = {
      $or: [
        { subscriptionStatus: { $exists: false } },
        { subscriptionStatus: null },
        { subscriptionStatus: "inactive" },
        { subscriptionStatus: "canceled" },
        { subscriptionStatus: "past_due" }
      ]
    };

    const update = {
      $set: {
        subscriptionStatus: "active", // Los marcamos como activos internamente
        currentPeriodEnd: threeMonthsFromNow,
        stripeCustomerId: "legacy_user_gift", // Marcador para identificar que fue regalado
        stripeSubscriptionId: "legacy_gift_3_months",
        promoUsed: true
      }
    };

    const result = await User.updateMany(filter, update);

    console.log(`🎉 ¡Éxito! Se han regalado 3 meses de acceso a ${result.modifiedCount} usuarios.`);
    console.log(`📅 Su acceso expirará el: ${threeMonthsFromNow.toLocaleDateString()}`);

  } catch (error) {
    console.error("❌ Error ejecutando el script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Desconectado");
    process.exit(0);
  }
}

grantFreeAccessToExistingUsers();
