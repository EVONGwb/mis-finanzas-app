import { Router } from "express";
import { getBankData, closeMonth, openMonth } from "../controllers/bank.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

router.get("/", requireAuth, wrap(getBankData));
router.post("/close", requireAuth, wrap(closeMonth));
router.post("/open", requireAuth, wrap(openMonth));

export default router;
