import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: "general" },
    concept: { type: String, default: "" },
    paymentMethod: { type: String, default: "cash" }
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", ExpenseSchema);
