import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { 
  getUsers, 
  createUser, 
  updateUserRole, 
  resetUserPassword, 
  deleteUser 
} from "../controllers/admin.controller.js";

const router = Router();

// Middleware para todas las rutas admin
router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/admin/users", getUsers);
router.post("/admin/users", createUser);
router.patch("/admin/users/:id/role", updateUserRole);
router.patch("/admin/users/:id/password", resetUserPassword);
router.delete("/admin/users/:id", deleteUser);

export default router;
