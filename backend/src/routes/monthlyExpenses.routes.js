import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  getMonthlyStatus,
  confirmExpense,
  revokeExpense
} from "../controllers/monthlyExpenses.controller.js";

const router = Router();

// Templates
router.get("/templates", requireAuth, wrap(getTemplates));
router.post("/templates", requireAuth, wrap(createTemplate));
router.patch("/templates/:id", requireAuth, wrap(updateTemplate));
router.delete("/templates/:id", requireAuth, wrap(deleteTemplate));

// Monthly Status & Actions
router.get("/status", requireAuth, wrap(getMonthlyStatus)); // ?month=X&year=Y
router.post("/confirm", requireAuth, wrap(confirmExpense));
router.delete("/revoke/:instanceId", requireAuth, wrap(revokeExpense));

export default router;
