import { Router } from "express";
import {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/users.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { wrap } from "../utils/wrap.js";

const router = Router();

// Collection
router.get("/users", requireAuth, wrap(listUsers));
router.post("/users", requireAuth, requireRole("admin"), wrap(createUser));

// Item
router.get("/users/:id", requireAuth, wrap(getUserById));
router.patch("/users/:id", requireAuth, requireRole("admin"), wrap(updateUser));
router.delete("/users/:id", requireAuth, requireRole("admin"), wrap(deleteUser));

export default router;
