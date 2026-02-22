import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { 
  getUsers, 
  createUser, 
  updateUserRole, 
  resetUserPassword, 
  deleteUser, 
  promoteSelf // Importar controlador temporal
} from "../controllers/admin.controller.js";

const router = Router();

// Esta ruta debe estar ANTES de router.use(requireRole("admin"))
// y no necesita requireAuth aquí si ya se usa globalmente o se aplica individualmente.
// En este caso, aplicamos requireAuth explícitamente para mayor claridad y seguridad,
// aunque router.use(requireAuth) ya lo cubriría si está arriba.
// Para evitar conflictos con middlewares globales, la definimos explícitamente:

router.post("/promote-self", requireAuth, promoteSelf);

router.use(requireAuth);
router.use(requireRole("admin"));

router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/password", resetUserPassword);
router.delete("/users/:id", deleteUser);

export default router;
