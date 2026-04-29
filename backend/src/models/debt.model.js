import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "El importe del pago es obligatorio"],
    min: [0.01, "El importe debe ser positivo"]
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, { _id: true, timestamps: true });

const debtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, "El nombre de la deuda es obligatorio"],
    trim: true,
    maxlength: 100
  },
  creditor: {
    type: String,
    trim: true,
    maxlength: 100
  },
  totalAmount: {
    type: Number,
    required: [true, "El importe total es obligatorio"],
    min: [0.01, "El importe total debe ser positivo"]
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ["active", "paid"],
    default: "active"
  },
  trackingCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    uppercase: true,
    trim: true,
    immutable: true
  },
  payments: [paymentSchema]
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals calculados
debtSchema.virtual("totalPaid").get(function() {
  if (!this.payments || this.payments.length === 0) return 0;
  return this.payments.reduce((sum, p) => sum + p.amount, 0);
});

debtSchema.virtual("remaining").get(function() {
  const totalPaid = this.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  return Math.max(0, this.totalAmount - totalPaid);
});

debtSchema.virtual("progress").get(function() {
  if (this.totalAmount === 0) return 100;
  const totalPaid = this.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  return Math.min(100, (totalPaid / this.totalAmount) * 100);
});

export const Debt = mongoose.model("Debt", debtSchema);
