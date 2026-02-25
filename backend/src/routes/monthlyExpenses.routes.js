import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
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

router.use(requireAuth);

// Templates
router.get("/templates", getTemplates);
router.post("/templates", createTemplate);
router.patch("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

// Monthly Status & Actions
router.get("/status", getMonthlyStatus); // ?month=X&year=Y
router.post("/confirm", confirmExpense);
router.delete("/revoke/:instanceId", revokeExpense);

export default router;
