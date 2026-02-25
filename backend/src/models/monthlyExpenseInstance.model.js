import mongoose from "mongoose";

const MonthlyExpenseInstanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: "MonthlyExpenseTemplate", required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed"], default: "pending" },
  confirmedAt: { type: Date },
  amount: { type: Number, required: true }, // The actual amount paid (can differ from template default)
  bankMovement: { type: mongoose.Schema.Types.ObjectId, ref: "BankMovement" } // Link to bank deduction
}, { timestamps: true });

// Ensure unique instance per template per month
MonthlyExpenseInstanceSchema.index({ template: 1, month: 1, year: 1 }, { unique: true });

export const MonthlyExpenseInstance = mongoose.model("MonthlyExpenseInstance", MonthlyExpenseInstanceSchema);
