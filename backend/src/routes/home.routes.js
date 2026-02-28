import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getHome,
  sendHomeRequest,
  respondHomeRequest,
  leaveHome,
  updateHomeName,
  getInventory,
  addProduct,
  updateProduct,
  deleteProduct,
  getShoppingList,
  addToShoppingList,
  buyItem,
  deleteShoppingItem,
  getHistory
} from "../controllers/home.controller.js";

const router = Router();

router.use(requireAuth);

// Gestión Hogar
router.get("/home", getHome);
router.post("/home/request", sendHomeRequest);
router.post("/home/respond", respondHomeRequest);
router.post("/home/leave", leaveHome);
router.patch("/home/name", updateHomeName);

// Inventario
router.get("/home/inventory", getInventory);
router.post("/home/inventory", addProduct);
router.patch("/home/inventory/:id", updateProduct);
router.delete("/home/inventory/:id", deleteProduct);

// Lista de Compra
router.get("/home/shopping-list", getShoppingList);
router.post("/home/shopping-list", addToShoppingList);
router.post("/home/shopping-list/:id/buy", buyItem); // Marcar comprado
router.delete("/home/shopping-list/:id", deleteShoppingItem);

// Historial
router.get("/home/history", getHistory);

export default router;
