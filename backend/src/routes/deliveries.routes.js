import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { 
  getCompanies, 
  createCompany, 
  updateCompany, 
  deleteCompany 
} from "../controllers/company.controller.js";
import { 
  getWorkEntries, 
  getDashboardStats, 
  createWorkEntry, 
  updateWorkEntry, 
  deleteWorkEntry 
} from "../controllers/workEntry.controller.js";

const router = Router();

router.use(requireAuth);

// Companies
router.get("/companies", getCompanies);
router.post("/companies", createCompany);
router.patch("/companies/:id", updateCompany);
router.delete("/companies/:id", deleteCompany);

// Work Entries
router.get("/work-entries", getWorkEntries);
router.get("/work-entries/stats", getDashboardStats);
router.post("/work-entries", createWorkEntry);
router.patch("/work-entries/:id", updateWorkEntry);
router.delete("/work-entries/:id", deleteWorkEntry);

export default router;
