import mongoose from "mongoose";

const deudaTrackingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null
    },
    clienteCodigo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 6,
      maxlength: 64
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    pagado: {
      type: Number,
      default: 0,
      min: 0
    },
    fechaInicio: {
      type: Date,
      default: Date.now
    },
    fechaFin: {
      type: Date,
      default: null
    },
    estado: {
      type: String,
      enum: ["activo", "pagado"],
      default: "activo"
    }
  },
  { timestamps: true, versionKey: false }
);

export const DeudaTracking = mongoose.model("DeudaTracking", deudaTrackingSchema);

