import mongoose from "mongoose";
import { logger } from "./logger.js";

export async function connectDB(uri) {
  if (!uri || uri.trim().length === 0) {
    logger.warn("MONGODB_URI no está configurado (backend funcionando sin DB)");
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info("✅ Conectado a MongoDB");
}
