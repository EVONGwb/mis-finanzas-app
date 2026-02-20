import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getSummary } from "../controllers/summary.controller.js";

const router = Router();

router.get("/summary", requireAuth, getSummary);

export default router;
