import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
	getOrders,
	getOrderById,
	updateOrderStatus,
	updateOrderShipping,
} from "../controllers/order.js";
import { getImageSignedUrl } from "@/controllers/image.js";

const apiRouter = express.Router();

// 認証ミドルウェアを設定
apiRouter.use(authenticate);

// 注文一覧の取得
apiRouter.get("/orders", getOrders);

// 注文詳細の取得
apiRouter.get("/orders/:id", getOrderById);

// 注文ステータスの更新
apiRouter.patch("/orders/:id/status", updateOrderStatus);

// 発送情報の更新
apiRouter.patch("/orders/:id/shipping", updateOrderShipping);

// 発送情報の更新
apiRouter.get("/images/:id/signed-url", getImageSignedUrl);

export default apiRouter;
