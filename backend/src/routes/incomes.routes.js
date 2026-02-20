import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listIncomes, createIncome, deleteIncome } from "../controllers/incomes.controller.js";

const router = Router();

router.get("/incomes", requireAuth, listIncomes);
router.post("/incomes", requireAuth, createIncome);
router.delete("/incomes/:id", requireAuth, deleteIncome);

export default router;
