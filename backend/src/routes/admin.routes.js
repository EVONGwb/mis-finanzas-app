import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { 
  getUsers, 
  createUser, 
  updateUserRole, 
  resetUserPassword, 
  deleteUser, 
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/password", resetUserPassword);
router.delete("/users/:id", deleteUser);

export default router;
