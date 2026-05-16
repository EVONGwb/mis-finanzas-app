import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { listIncomes, createIncome, deleteIncome } from "../controllers/incomes.controller.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

router.get("/incomes", requireAuth, wrap(listIncomes));
router.post("/incomes", requireAuth, wrap(createIncome));
router.delete("/incomes/:id", requireAuth, wrap(deleteIncome));

export default router;
