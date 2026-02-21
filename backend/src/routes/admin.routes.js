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
// router.use(requireAuth);
// router.use(requireRole("admin"));

// IMPORTANTE: Al usar router.use(requireRole("admin")), se aplicaba a TODAS las rutas subsiguientes
// si este router se montaba en el path raíz "/api" en server.js junto con otros routers.
// Para evitar efectos colaterales, protegemos ruta por ruta o usamos un prefijo claro.

router.get("/admin/users", requireAuth, requireRole("admin"), getUsers);
router.post("/admin/users", requireAuth, requireRole("admin"), createUser);
router.patch("/admin/users/:id/role", requireAuth, requireRole("admin"), updateUserRole);
router.patch("/admin/users/:id/password", requireAuth, requireRole("admin"), resetUserPassword);
router.delete("/admin/users/:id", requireAuth, requireRole("admin"), deleteUser);

export default router;
