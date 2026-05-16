import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getSummary } from "../controllers/summary.controller.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

router.get("/summary", requireAuth, wrap(getSummary));

export default router;
