import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middlewares/auth.js";
import { 
  getDebts, 
  createDebt, 
  consultarDebtPublic,
  updateDebt, 
  deleteDebt, 
  addPayment, 
  deletePayment 
} from "../controllers/debt.controller.js";

const router = Router();

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res, next);
  } catch (err) {
    return next(err);
  }
};

const debtPublicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/debts/consultar", debtPublicLimiter, wrap(consultarDebtPublic));

router.get("/debts", requireAuth, wrap(getDebts));
router.post("/debts", requireAuth, wrap(createDebt));
router.patch("/debts/:id", requireAuth, wrap(updateDebt));
router.delete("/debts/:id", requireAuth, wrap(deleteDebt));

// Gestión de pagos
router.post("/debts/:id/payments", requireAuth, wrap(addPayment));
router.delete("/debts/:id/payments/:paymentId", requireAuth, wrap(deletePayment));

export default router;
