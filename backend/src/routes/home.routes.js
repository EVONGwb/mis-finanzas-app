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

const wrap = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res, next);
  } catch (err) {
    return next(err);
  }
};

// Gestión Hogar
router.get("/home", requireAuth, wrap(getHome));
router.post("/home/request", requireAuth, wrap(sendHomeRequest));
router.post("/home/respond", requireAuth, wrap(respondHomeRequest));
router.post("/home/leave", requireAuth, wrap(leaveHome));
router.patch("/home/name", requireAuth, wrap(updateHomeName));

// Inventario
router.get("/home/inventory", requireAuth, wrap(getInventory));
router.post("/home/inventory", requireAuth, wrap(addProduct));
router.patch("/home/inventory/:id", requireAuth, wrap(updateProduct));
router.delete("/home/inventory/:id", requireAuth, wrap(deleteProduct));

// Lista de Compra
router.get("/home/shopping-list", requireAuth, wrap(getShoppingList));
router.post("/home/shopping-list", requireAuth, wrap(addToShoppingList));
router.post("/home/shopping-list/:id/buy", requireAuth, wrap(buyItem)); // Marcar comprado
router.delete("/home/shopping-list/:id", requireAuth, wrap(deleteShoppingItem));

// Historial
router.get("/home/history", requireAuth, wrap(getHistory));

export default router;
