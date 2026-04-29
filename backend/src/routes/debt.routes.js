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

const debtPublicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/debts/consultar", debtPublicLimiter, async (req, res, next) => {
  try {
    return await consultarDebtPublic(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.use(requireAuth);

router.get("/debts", getDebts);
router.post("/debts", createDebt);
router.patch("/debts/:id", updateDebt);
router.delete("/debts/:id", deleteDebt);

// Gestión de pagos
router.post("/debts/:id/payments", addPayment);
router.delete("/debts/:id/payments/:paymentId", deletePayment);

export default router;
