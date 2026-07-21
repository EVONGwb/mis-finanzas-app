import { Router } from "express";
import { getBankData, closeMonth, openMonth, resetBankFromMonth } from "../controllers/bank.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

router.get("/", requireAuth, wrap(getBankData));
router.post("/close", requireAuth, wrap(closeMonth));
router.post("/open", requireAuth, wrap(openMonth));
router.post("/reset", requireAuth, wrap(resetBankFromMonth));

export default router;
