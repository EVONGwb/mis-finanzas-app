import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listExpenses, createExpense, deleteExpense } from "../controllers/expenses.controller.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

router.get("/expenses", requireAuth, wrap(listExpenses));
router.post("/expenses", requireAuth, wrap(createExpense));
router.delete("/expenses/:id", requireAuth, wrap(deleteExpense));

export default router;
