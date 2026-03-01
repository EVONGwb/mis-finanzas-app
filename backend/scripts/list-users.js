import mongoose from "mongoose";
import { User } from "../src/models/user.model.js";
import { env } from "../src/config/env.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function listUsers() {
  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI no encontrada");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB");

    const users = await User.find({}, { email: 1, name: 1, role: 1 });
    
    console.log(`\n📋 Encontrados ${users.length} usuarios:`);
    users.forEach(u => {
      console.log(`- ${u.email} | Role: ${u.role} | Name: ${u.name}`);
    });
    console.log("\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listUsers();
