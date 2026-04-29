import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/auth.js";
import {
  getCredits,
  createCredit,
  consultarCreditPublic,
  updateCredit,
  deleteCredit,
  addPayment,
  deletePayment
} from "../controllers/credit.controller.js";

const router = Router();

const creditPublicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/credits/consultar", creditPublicLimiter, async (req, res, next) => {
  try {
    return await consultarCreditPublic(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.use(requireAuth);

router.get("/credits", getCredits);
router.post("/credits", createCredit);
router.patch("/credits/:id", updateCredit);
router.delete("/credits/:id", deleteCredit);

// Pagos (Cobros parciales)
router.post("/credits/:id/payments", addPayment);
router.delete("/credits/:id/payments/:paymentId", deletePayment);

export default router;
