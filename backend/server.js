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
import { notFound } from "./src/middlewares/notFound.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://traec4kjypht.vercel.app"
    ],
    credentials: true
  })
);
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

// Rutas
app.use("/api", healthRoutes);
app.use("/api", usersRoutes);
app.use("/api", authRoutes);

app.use("/api", incomesRoutes);
app.use("/api", expensesRoutes);
app.use("/api", summaryRoutes);
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
