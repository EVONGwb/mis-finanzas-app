import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/user.model.js";

// Hardcodeamos la URI de producción de Render para este script específico
// Normalmente esto debería venir de process.env, pero como estamos corriendo localmente contra la DB remota,
// y queremos asegurarnos de que usa la de producción, la definimos aquí o la pasamos por consola.
// Para seguridad, intentamos leer de process.env.MONGODB_URI_PROD o usamos la que está en el .env si es la correcta.
// En este caso, asumimos que la URI del .env local es la de desarrollo y necesitamos la de producción.

// SI NO TIENES LA URI DE PRODUCCIÓN AQUÍ, EL SCRIPT NO FUNCIONARÁ CONTRA RENDER.
// Asumiré que quieres que el script use la variable de entorno MONGODB_URI que se le pase al ejecutar.

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI environment variable is required");
  process.exit(1);
}

async function createAdminProd() {
  try {
    console.log(`Connecting to DB... (${MONGODB_URI.split('@')[1] || 'hidden'})`);
    await mongoose.connect(MONGODB_URI);

    const email = "admin@evongo.com";
    const password = "123456";
    const name = "Admin";
    const role = "admin";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Admin user already exists in PROD. Updating role...");
      existingUser.role = role;
      
      // Reset password to ensure access
      const salt = await bcrypt.genSalt(10);
      existingUser.passwordHash = await bcrypt.hash(password, salt);
      
      await existingUser.save();
      console.log("Admin updated successfully (role + password reset).");
    } else {
      console.log("Creating new admin user in PROD...");
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await User.create({
        email,
        passwordHash,
        name,
        role
      });
      console.log("Admin created successfully.");
    }

    console.log("Closing connection...");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin in PROD:", error);
    process.exit(1);
  }
}

createAdminProd();
