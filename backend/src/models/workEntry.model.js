import mongoose from "mongoose";

const workEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: [true, "La empresa es obligatoria"]
  },
  date: {
    type: Date,
    required: [true, "La fecha es obligatoria"],
    default: Date.now
  },
  hours: {
    type: Number,
    required: [true, "Las horas son obligatorias"],
    min: [0.1, "Las horas deben ser mayor a 0"],
    max: [24, "No puedes trabajar más de 24h en un día"]
  },
  hourlyRate: {
    type: Number,
    required: [true, "El precio por hora es obligatorio"],
    min: [0, "El precio por hora no puede ser negativo"]
  },
  total: {
    type: Number,
    // required: true, // Eliminamos required explícito para que el pre-save funcione si no se pasa
    min: [0, "El total no puede ser negativo"]
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, "Las notas son demasiado largas"]
  }
}, {
  timestamps: true,
  versionKey: false
});

// Middleware pre-save para asegurar el cálculo del total
workEntrySchema.pre("save", function(next) {
  // Aseguramos que existan valores numéricos
  const h = this.hours || 0;
  const r = this.hourlyRate || 0;
  
  this.total = parseFloat((h * r).toFixed(2));
  next();
});

export const WorkEntry = mongoose.model("WorkEntry", workEntrySchema);
