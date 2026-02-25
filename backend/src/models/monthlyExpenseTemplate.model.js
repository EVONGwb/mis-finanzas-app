import mongoose from "mongoose";

const MonthlyExpenseTemplateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, default: "mensual" },
  defaultAmount: { type: Number, required: true, min: 0 },
  dueDay: { type: Number, required: true, min: 1, max: 31 },
  isActive: { type: Boolean, default: true },
  isVariable: { type: Boolean, default: false } // If true, user can edit amount before confirming
}, { timestamps: true });

export const MonthlyExpenseTemplate = mongoose.model("MonthlyExpenseTemplate", MonthlyExpenseTemplateSchema);
