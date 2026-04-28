import { Router } from "express";
import rateLimit from "express-rate-limit";
import { consultarDeuda } from "../controllers/deuda.controller.js";

const router = Router();

const deudaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/deuda/consultar", deudaLimiter, async (req, res, next) => {
  try {
    return await consultarDeuda(req, res, next);
  } catch (err) {
    return next(err);
  }
});

export default router;

