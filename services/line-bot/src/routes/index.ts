import express from "express";
import { middleware } from "@line/bot-sdk";
import { lineMiddlewareConfig } from "../config/line.js";
import { handleWebhook } from "../controllers/webhook.js";

const router = express.Router();

// ヘルスチェックエンドポイント
router.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// LINE Webhook
router.post("/webhook", middleware(lineMiddlewareConfig), handleWebhook);

export default router;
