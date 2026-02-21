import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/user.model.js";
import { env } from "../src/config/env.js";

async function createAdmin() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(env.MONGODB_URI);

    const email = "admin@evongo.com";
    const password = "123456";
    const name = "Admin";
    const role = "admin";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Admin user already exists. Updating role...");
      existingUser.role = role;
      // Opcional: actualizar password si quieres resetearla siempre
      // const salt = await bcrypt.genSalt(10);
      // existingUser.passwordHash = await bcrypt.hash(password, salt);
      await existingUser.save();
      console.log("Admin updated successfully.");
    } else {
      console.log("Creating new admin user...");
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

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
