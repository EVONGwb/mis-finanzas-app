import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { 
  createCheckoutSession, 
  createPortalSession, 
  handleWebhook 
} from "../controllers/billing.controller.js";
import express from "express";

const router = Router();

// Webhook must use raw body, handled in server.js or here if we use a specific middleware chain
// But typically webhooks are top-level. 
// However, if we mount this router under /api/billing, we need to be careful with bodyParser.
// The user instruction says: "Montar webhook antes de express.json()" in server.js.
// So we will NOT include webhook here, but import it in server.js directly.

router.post("/create-checkout-session", requireAuth, createCheckoutSession);
router.post("/create-portal-session", requireAuth, createPortalSession);

export default router;
