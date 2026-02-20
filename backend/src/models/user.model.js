import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    role: { type: String, default: "user" }, // user | admin
    passwordHash: { type: String, required: true, select: false }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
