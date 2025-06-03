import express from "express";
import { middleware } from "@line/bot-sdk";
import { lineMiddlewareConfig } from "../config/line.js";
import { handleWebhook } from "../controllers/webhook.js";
import { checkOrderAcceptance } from "@/middleware/order-acceptance-check.js";

const router = express.Router();

router.use(checkOrderAcceptance);

// ヘルスチェックエンドポイント
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// LINE Webhook
router.post("/webhook", middleware(lineMiddlewareConfig), handleWebhook);

export default router;
