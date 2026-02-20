import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listExpenses, createExpense, deleteExpense } from "../controllers/expenses.controller.js";

const router = Router();

router.get("/expenses", requireAuth, listExpenses);
router.post("/expenses", requireAuth, createExpense);
router.delete("/expenses/:id", requireAuth, deleteExpense);

export default router;
