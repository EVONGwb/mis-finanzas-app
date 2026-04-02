import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: [true, "El nombre de la empresa es obligatorio"],
    trim: true,
    maxlength: [100, "El nombre no puede exceder 100 caracteres"]
  },
  hourlyRateDefault: {
    type: Number,
    required: [true, "El precio por hora estándar es obligatorio"],
    min: [0, "El precio por hora no puede ser negativo"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deductions: {
    commonContingencies: { type: Number, default: 4.85, min: 0, max: 100 },
    unemploymentAccident: { type: Number, default: 1.65, min: 0, max: 100 },
    irpf: { type: Number, default: 20.0, min: 0, max: 100 },
    other: { type: Number, default: 0, min: 0, max: 100 },
    otherConcept: { type: String, default: "", trim: true }
  },
  supplements: {
    benefits: { type: Number, default: 0, min: 0 },
    agreementBonus: { type: Number, default: 0, min: 0 },
    proratedPayments: { type: Number, default: 0, min: 0 },
    voluntaryImprovement: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
    otherConcept: { type: String, default: "", trim: true }
  },
  limitRule: {
    enabled: { type: Boolean, default: false },
    amount: { type: Number, default: 1600, min: 0 }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "La descripción es demasiado larga"]
  },
  monthlyOverrides: [{
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    hourlyRateDefault: Number,
    deductions: {
      commonContingencies: Number,
      unemploymentAccident: Number,
      irpf: Number,
      other: Number,
      otherConcept: String
    },
    supplements: {
      benefits: Number,
      agreementBonus: Number,
      proratedPayments: Number,
      voluntaryImprovement: Number,
      other: Number,
      otherConcept: String
    },
    limitRule: {
      enabled: Boolean,
      amount: Number
    }
  }]
}, {
  timestamps: true,
  versionKey: false
});

// Índice compuesto para evitar nombres duplicados por usuario
companySchema.index({ user: 1, name: 1 }, { unique: true });

export const Company = mongoose.model("Company", companySchema);
