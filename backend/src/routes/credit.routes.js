import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getCredits,
  createCredit,
  updateCredit,
  deleteCredit,
  addPayment,
  deletePayment
} from "../controllers/credit.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/credits", getCredits);
router.post("/credits", createCredit);
router.patch("/credits/:id", updateCredit);
router.delete("/credits/:id", deleteCredit);

// Pagos (Cobros parciales)
router.post("/credits/:id/payments", addPayment);
router.delete("/credits/:id/payments/:paymentId", deletePayment);

export default router;