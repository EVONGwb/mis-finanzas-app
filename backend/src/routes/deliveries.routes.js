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

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res, next);
  } catch (err) {
    return next(err);
  }
};

// Companies
router.get("/companies", requireAuth, wrap(getCompanies));
router.post("/companies", requireAuth, wrap(createCompany));
router.patch("/companies/:id", requireAuth, wrap(updateCompany));
router.delete("/companies/:id", requireAuth, wrap(deleteCompany));

// Work Entries
router.get("/work-entries", requireAuth, wrap(getWorkEntries));
router.get("/work-entries/stats", requireAuth, wrap(getDashboardStats));
router.post("/work-entries", requireAuth, wrap(createWorkEntry));
router.patch("/work-entries/:id", requireAuth, wrap(updateWorkEntry));
router.delete("/work-entries/:id", requireAuth, wrap(deleteWorkEntry));

export default router;
