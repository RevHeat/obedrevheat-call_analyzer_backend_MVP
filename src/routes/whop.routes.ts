import { Router } from "express";

const router = Router();

// Webhook route is mounted directly in app.ts (before JSON parser)
// This file exists for any future Whop-specific authenticated routes

export default router;
