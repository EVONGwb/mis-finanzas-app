import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listExpenses, createExpense, deleteExpense, resetExpenses } from "../controllers/expenses.controller.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

router.get("/expenses", requireAuth, wrap(listExpenses));
router.post("/expenses", requireAuth, wrap(createExpense));
router.post("/expenses/reset", requireAuth, wrap(resetExpenses));
router.delete("/expenses/:id", requireAuth, wrap(deleteExpense));

export default router;
