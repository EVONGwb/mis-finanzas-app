import mongoose from "mongoose";

const IncomeReceiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    year: { type: Number, required: true, min: 1970, max: 3000, index: true },
    month: { type: Number, required: true, min: 1, max: 12, index: true },
    amountReceived: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

IncomeReceiptSchema.index({ user: 1, company: 1, year: 1, month: 1 }, { unique: true });

export const IncomeReceipt = mongoose.model("IncomeReceipt", IncomeReceiptSchema);

