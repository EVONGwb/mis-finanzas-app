import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";
import { listIncomeReceipts, upsertIncomeReceipt } from "../controllers/incomeReceipts.controller.js";

const router = express.Router();

router.get("/income-receipts", requireAuth, wrap(listIncomeReceipts));
router.post("/income-receipts", requireAuth, wrap(upsertIncomeReceipt));

export default router;

