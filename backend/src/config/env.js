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
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  GOCARDLESS_SECRET_ID: process.env.GOCARDLESS_SECRET_ID || "",
  GOCARDLESS_SECRET_KEY: process.env.GOCARDLESS_SECRET_KEY || "",

  TRUELAYER_CLIENT_ID: process.env.TRUELAYER_CLIENT_ID || "",
  TRUELAYER_CLIENT_SECRET: process.env.TRUELAYER_CLIENT_SECRET || "",
  TRUELAYER_ENV: process.env.TRUELAYER_ENV || "sandbox",
  TRUELAYER_SCOPES: process.env.TRUELAYER_SCOPES || "info accounts balance transactions cards offline_access",
  TRUELAYER_PROVIDERS: process.env.TRUELAYER_PROVIDERS || ""
};

// Si quieres OBLIGAR Mongo en producción:
// if (env.NODE_ENV === "production") required("MONGODB_URI");
