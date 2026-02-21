import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { listAuditLogs } from "../controllers/audit.controller.js";

const router = Router();

// Endpoint exclusivo para ADMIN
router.get("/audit", requireAuth, requireRole("admin"), listAuditLogs);

export default router;
