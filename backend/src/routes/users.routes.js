import { Router } from "express";
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/users.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Collection
router.get("/users", requireAuth, listUsers);
router.post("/users", requireAuth, requireRole("admin"), createUser);

// Item
router.get("/users/:id", requireAuth, getUserById);
router.patch("/users/:id", requireAuth, requireRole("admin"), updateUser);
router.delete("/users/:id", requireAuth, requireRole("admin"), deleteUser);

export default router;
