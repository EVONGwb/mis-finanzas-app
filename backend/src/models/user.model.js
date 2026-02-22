import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    role: { type: String, default: "user" }, // user | admin
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
