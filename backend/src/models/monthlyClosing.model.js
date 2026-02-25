import mongoose from "mongoose";

const MonthlyClosingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  totalAmount: { type: Number, required: true }, // Net + Excess
  details: {
    netoNomina: Number,
    excedenteLibre: Number,
    ingresosBrutos: Number,
    gastosMes: Number // Just for record
  },
  closedAt: { type: Date, default: Date.now },
  isLocked: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique closing per month per user
MonthlyClosingSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export const MonthlyClosing = mongoose.model("MonthlyClosing", MonthlyClosingSchema);
