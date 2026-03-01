import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import incomesRoutes from "./src/routes/incomes.routes.js";
import expensesRoutes from "./src/routes/expenses.routes.js";
import summaryRoutes from "./src/routes/summary.routes.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/config/logger.js";
import { httpLogger } from "./src/middlewares/httpLogger.js";

import { connectDB } from "./src/config/db.js";
import healthRoutes from "./src/routes/health.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import auditRoutes from "./src/routes/audit.routes.js";
import deliveriesRoutes from "./src/routes/deliveries.routes.js";
import debtsRoutes from "./src/routes/debt.routes.js";
import homeRoutes from "./src/routes/home.routes.js";
import creditRoutes from "./src/routes/credit.routes.js";
import bankRoutes from "./src/routes/bank.routes.js";
import monthlyExpensesRoutes from "./src/routes/monthlyExpenses.routes.js";
import billingRoutes from "./src/routes/billing.routes.js";
import { handleWebhook } from "./src/controllers/billing.controller.js";
import { requireActiveSubscription } from "./src/middlewares/requireActiveSubscription.js";
import { notFound } from "./src/middlewares/notFound.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://traec4kjypht.vercel.app",
  "https://mis-finanzas-app-nine.vercel.app",
  "https://misfinanzas.es",
  "https://www.misfinanzas.es",
  "https://mis-finanzas-app.vercel.app",
  "https://mis-finanzas-app.onrender.com"
];

app.use(cors({
  origin: function(origin, cb) {
    if (!origin) return cb(null, true);
    // Permitir subdominios de vercel.app automáticamente
    if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));

// Express 5 / path-to-regexp requires escaping or using correct syntax for wildcards
// app.options("*", cors()); // This fails in Express 5 with "Missing parameter name"
// Using a middleware for OPTIONS instead:
app.options(/.*/, cors()); 

// Webhook Stripe (antes de express.json)
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json()); app.use(helmet());

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// Logs de cada request
app.use(httpLogger);

// Rutas Públicas y Auth
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api/billing", billingRoutes); // Checkout y Portal (tienen requireAuth interno)

// Rutas Protegidas por Suscripción
// Aplicar requireActiveSubscription a todas las rutas de negocio
// Nota: requireAuth ya debería estar aplicado en cada ruta o aquí globalmente si se desea.
// Asumiendo que las rutas ya tienen requireAuth, añadimos requireActiveSubscription
// Pero requireActiveSubscription requiere req.user, así que debe ir DESPUÉS de requireAuth.
// Como requireAuth está DENTRO de cada router (ej: users.routes.js), 
// no podemos poner requireActiveSubscription aquí globalmente FÁCILMENTE sin requireAuth antes.
//
// Sin embargo, podemos hacer un middleware wrapper o aplicarlo ruta por ruta.
// O mejor, modificar los routers para incluirlo. 
// Pero el usuario pidió "Proteger rutas con requireActiveSubscription" y "Indicar dónde añadir".
//
// Opción: Aplicar middleware a nivel de app.use para grupos de rutas, PERO asegurando que requireAuth se ejecute.
// Si los routers ya tienen requireAuth, requireActiveSubscription fallará si no hay user.
//
// Vamos a inyectarlo en los routers que lo necesiten.
// O mejor, agrupamos las rutas de negocio bajo un router común o middleware.

// Solución: Middleware que verifica user. Si no hay user, pasa (deja que requireAuth lo capture en el router).
// Si hay user, verifica suscripción.
// Pero requireActiveSubscription lanza 401 si no hay user.
//
// Vamos a asumir que las rutas de negocio SIEMPRE requieren auth.
// Así que podemos hacer:
// app.use("/api", requireAuth, requireActiveSubscription, businessRoutes);
// Pero requireAuth está importado de middlewares/auth.js (necesito importarlo).

import { requireAuth } from "./src/middlewares/auth.js";

const businessMiddleware = [requireAuth, requireActiveSubscription];

app.use("/api", usersRoutes); // Users puede ser mixto (profile vs admin), dejémoslo fuera o protejamos solo ciertas partes?
// El usuario dijo: "Protege home, finanzas, expenses, incomes, bank, debts, credits, deliveries, admin"
// Admin routes también? Sí.

app.use("/api/admin", ...businessMiddleware, adminRoutes);
app.use("/api", ...businessMiddleware, auditRoutes);
app.use("/api", ...businessMiddleware, deliveriesRoutes);
app.use("/api", ...businessMiddleware, debtsRoutes);
app.use("/api", ...businessMiddleware, homeRoutes);
app.use("/api", ...businessMiddleware, creditRoutes);
app.use("/api/bank", ...businessMiddleware, bankRoutes);
app.use("/api/monthly-expenses", ...businessMiddleware, monthlyExpensesRoutes);
app.use("/api", ...businessMiddleware, incomesRoutes);
app.use("/api", ...businessMiddleware, expensesRoutes);
app.use("/api", ...businessMiddleware, summaryRoutes);

// 404 + errores
app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB(env.MONGODB_URI);

  app.listen(env.PORT, () => {
    logger.info(`🚀 API en http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

start().catch((err) => {
  logger.error(err, "❌ Error al iniciar");
  process.exit(1);
});
