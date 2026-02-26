import mongoose from "mongoose";

const BankMovementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, required: true }, // e.g., 'cierre_mes', 'gasto', 'manual'
  description: { type: String, required: true },
  amount: { type: Number, required: true }, // Positive for income, negative for expense (usually handled by type, but amount can be stored as signed)
  date: { type: Date, default: Date.now },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // Link to MonthlyClosing or Expense
  relatedModel: { type: String, enum: ["MonthlyClosing", "Expense", "MonthlyExpenseInstance"] }
}, { timestamps: true });

export const BankMovement = mongoose.model("BankMovement", BankMovementSchema);
