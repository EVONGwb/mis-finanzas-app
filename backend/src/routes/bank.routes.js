import { Router } from "express";
import { getBankData, closeMonth, openMonth } from "../controllers/bank.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getBankData);
router.post("/close", closeMonth);
router.post("/open", openMonth);

export default router;
