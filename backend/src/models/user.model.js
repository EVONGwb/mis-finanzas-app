import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    role: { type: String, default: "user" }, // user | admin
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    currency: { type: String, default: "EUR" },

    biometricEnabled: { type: Boolean, default: false },
    webauthnCredentials: [
      {
        credentialID: { type: String, required: true },
        publicKey: { type: String, required: true },
        counter: { type: Number, default: 0 },
        transports: [{ type: String }],
        deviceType: { type: String },
        backedUp: { type: Boolean, default: false }
      }
    ],
    webauthnCurrentChallenge: { type: String, default: null },
    
    // Stripe Subscription Fields
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    subscriptionStatus: { type: String, default: "inactive" }, // active, trialing, past_due, canceled, unpaid, incomplete
    currentPeriodEnd: { type: Date, default: null },
    promoUsed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
