import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";
import {
  createConnection,
  deleteConnection,
  getOpenBankingStatus,
  handleTrueLayerCallback,
  listConnections,
  listInstitutions,
  refreshConnection,
  syncConnection
} from "../controllers/bankConnections.controller.js";

const router = Router();

router.get("/status", requireAuth, wrap(getOpenBankingStatus));
router.get("/institutions", requireAuth, wrap(listInstitutions));
router.get("/connections", requireAuth, wrap(listConnections));
router.post("/connections", requireAuth, wrap(createConnection));
router.post("/truelayer/callback", requireAuth, wrap(handleTrueLayerCallback));
router.post("/connections/:id/refresh", requireAuth, wrap(refreshConnection));
router.post("/connections/:id/sync", requireAuth, wrap(syncConnection));
router.delete("/connections/:id", requireAuth, wrap(deleteConnection));

export default router;
