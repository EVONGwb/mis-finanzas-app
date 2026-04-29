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

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res, next);
  } catch (err) {
    return next(err);
  }
};

const creditPublicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/credits/consultar", creditPublicLimiter, wrap(consultarCreditPublic));

router.get("/credits", requireAuth, wrap(getCredits));
router.post("/credits", requireAuth, wrap(createCredit));
router.patch("/credits/:id", requireAuth, wrap(updateCredit));
router.delete("/credits/:id", requireAuth, wrap(deleteCredit));

// Pagos (Cobros parciales)
router.post("/credits/:id/payments", requireAuth, wrap(addPayment));
router.delete("/credits/:id/payments/:paymentId", requireAuth, wrap(deletePayment));

export default router;
