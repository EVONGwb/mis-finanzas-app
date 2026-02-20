import mongoose from "mongoose";

const IncomeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: "salary" },
    concept: { type: String, default: "" },
    source: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Income = mongoose.model("Income", IncomeSchema);
