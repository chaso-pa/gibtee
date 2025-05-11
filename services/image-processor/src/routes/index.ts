import express from "express";
import {
	convertImage,
	generateTshirtPreviewController,
} from "../controllers/images.js";

const router = express.Router();

// ヘルスチェックエンドポイント
router.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// 画像変換エンドポイント
router.post("/convert", convertImage);

// Tシャツプレビュー生成エンドポイント
router.post("/tshirt-preview", generateTshirtPreviewController);

export default router;
