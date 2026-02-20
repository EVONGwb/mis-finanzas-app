import dotenv from "dotenv";
dotenv.config();

export const env = {
CORS_ORIGINS: (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean),
RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 120),
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5050),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  MONGODB_URI: process.env.MONGODB_URI || "",

  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d"
};

// Si quieres OBLIGAR Mongo en producción:
// if (env.NODE_ENV === "production") required("MONGODB_URI");
