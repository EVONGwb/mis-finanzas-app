import mongoose from "mongoose";

const BankConnectionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["gocardless", "truelayer"], default: "gocardless", index: true },
    country: { type: String, default: "ES" },
    institutionId: { type: String, required: true },
    institutionName: { type: String, default: "" },
    requisitionId: { type: String, required: true, unique: true },
    reference: { type: String, required: true, unique: true },
    link: { type: String, default: "" },
    status: { type: String, enum: ["created", "linked", "expired", "error"], default: "created", index: true },
    accounts: [{ type: String }],
    cards: [{ type: String }],
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    tokenExpiresAt: { type: Date },
    scope: { type: String, default: "" },
    providerUserId: { type: String, default: "" },
    lastSyncedAt: { type: Date },
    error: { type: String, default: "" }
  },
  { timestamps: true }
);

BankConnectionSchema.index({ user: 1, provider: 1, requisitionId: 1 });

export const BankConnection = mongoose.model("BankConnection", BankConnectionSchema);
