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
  description: {
    type: String,
    trim: true,
    maxlength: [500, "La descripción es demasiado larga"]
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índice compuesto para evitar nombres duplicados por usuario
companySchema.index({ user: 1, name: 1 }, { unique: true });

export const Company = mongoose.model("Company", companySchema);
