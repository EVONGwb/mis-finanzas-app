import "dotenv/config";
import mongoose from "mongoose";
import { User } from "./src/models/user.model.js";

async function promoteAdmin() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI no definida en variables de entorno");
    }

    console.log("⏳ Conectando a la base de datos...");
    await mongoose.connect(uri);
    console.log("✅ Conexión exitosa");

    const email = "admin@misfinanzas.com";
    console.log(`🔍 Buscando usuario: ${email}`);
    
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error(`Usuario ${email} no encontrado`);
    }

    if (user.role === "admin") {
      console.log("ℹ️ El usuario ya es admin. No se requieren cambios.");
    } else {
      user.role = "admin";
      await user.save();
      console.log(`🎉 ÉXITO: Usuario ${email} promovido a rol ADMIN.`);
      console.log("Detalles:", { id: user._id, email: user.email, role: user.role });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Desconectado");
    process.exit(0);
  }
}

promoteAdmin();
