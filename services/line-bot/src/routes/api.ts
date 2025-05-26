import express from "express";
import { authenticate } from "@/middleware/auth.js";
import {
	getOrders,
	getOrderById,
	updateOrderStatus,
	updateOrderShipping,
	getOrderNotifications,
} from "@/controllers/order.js";
import { getImageSignedUrl } from "@/controllers/image.js";
import { getNotifications } from "@/controllers/notification.js";
import {
	getSystemSettings,
	updateSystemSettings,
	getOrderAcceptanceStatus,
} from "@/controllers/system-settings.js";

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

apiRouter.get("/orders/:id/notifications", getOrderNotifications);

// 発送情報の更新
apiRouter.get("/images/:id/signed-url", getImageSignedUrl);

// 通知情報の取得
apiRouter.get("/notifications", getNotifications);

// システム設定関連のエンドポイント
apiRouter.get("/admin/settings", getSystemSettings);
apiRouter.put("/admin/settings", updateSystemSettings);
apiRouter.get("/system/order-acceptance-status", getOrderAcceptanceStatus);

export default apiRouter;
