import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../src/models/user.model.js";

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.log("Uso: node scripts/make-admin.js user1@evongo.com");
  process.exit(1);
}

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Falta MONGODB_URI en .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: "admin" },
    { new: true }
  );

  if (!user) {
    console.log("❌ No encontrado:", email);
  } else {
    console.log("✅ Ahora es admin:", user.email, "role=", user.role);
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
