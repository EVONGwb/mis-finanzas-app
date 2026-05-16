import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";
import { 
  getUsers, 
  createUser, 
  updateUserRole, 
  resetUserPassword, 
  deleteUser, 
  getDashboardStats
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/dashboard", wrap(getDashboardStats));
router.get("/users", wrap(getUsers));
router.post("/users", wrap(createUser));
router.patch("/users/:id/role", wrap(updateUserRole));
router.patch("/users/:id/password", wrap(resetUserPassword));
router.delete("/users/:id", wrap(deleteUser));

export default router;
