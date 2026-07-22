import mongoose from "mongoose";

const BankSyncTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    connection: { type: mongoose.Schema.Types.ObjectId, ref: "BankConnection", required: true, index: true },
    provider: { type: String, enum: ["gocardless"], default: "gocardless", index: true },
    accountId: { type: String, required: true, index: true },
    transactionId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    bookingDate: { type: Date, required: true },
    description: { type: String, default: "" },
    expense: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
    bankMovement: { type: mongoose.Schema.Types.ObjectId, ref: "BankMovement" },
    raw: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

BankSyncTransactionSchema.index(
  { user: 1, provider: 1, accountId: 1, transactionId: 1 },
  { unique: true }
);

export const BankSyncTransaction = mongoose.model("BankSyncTransaction", BankSyncTransactionSchema);
