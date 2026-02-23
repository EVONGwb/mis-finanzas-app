import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { 
  getDebts, 
  createDebt, 
  updateDebt, 
  deleteDebt, 
  addPayment, 
  deletePayment 
} from "../controllers/debt.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/debts", getDebts);
router.post("/debts", createDebt);
router.patch("/debts/:id", updateDebt);
router.delete("/debts/:id", deleteDebt);

// Gestión de pagos
router.post("/debts/:id/payments", addPayment);
router.delete("/debts/:id/payments/:paymentId", deletePayment);

export default router;
