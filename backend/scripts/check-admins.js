import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../src/models/user.model.js";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from scripts/)
dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkAdmins() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to DB");

    const admins = await User.find({ role: "admin" });
    
    if (admins.length === 0) {
      console.log("No admin users found.");
    } else {
      console.log("Admin users found:");
      admins.forEach(admin => {
        console.log(`- ${admin.name} (${admin.email})`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

checkAdmins();
