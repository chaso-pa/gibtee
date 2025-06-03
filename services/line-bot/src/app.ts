import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./lib/prisma.js";
import routes from "./routes/index.js";
import apiRoutes from "./routes/api.js";
import stripeRoutes from "./routes/stripe.js";
import { stripeWebhook } from "./controllers/payment-webhook.js";
import authRoutes from "./routes/auth.js";
import { notifyError } from "./services/slack-notification.js";

// Prismaの接続テスト
prisma
	.$connect()
	.then(() => logger.info("Prismaがデータベースに接続しました"))
	.catch((e) => {
		logger.error(`Prisma接続エラー: ${e.message}`);
		notifyError("データベース接続エラー", e.message, { stack: e.stack });
	});

const app = express();

// ミドルウェア
app.use(helmet());
app.use(cors());
app.use(
	express.json({
		verify: (req, _res, buf) => {
			// LINE Webhookの署名検証のため生のリクエストボディを保持
			(req as any).rawBody = buf;
		},
	}),
);
app.use(express.urlencoded({ extended: true }));

// ビューエンジンの設定
app.set("views", path.join(import.meta.dirname, "views"));
app.set("view engine", "ejs");

// ルーティング
app.use("/", routes);

// API ルート（管理画面向け）
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/callback", stripeRoutes);

// エラーハンドリング
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		_next: express.NextFunction,
	) => {
		logger.error(`Error: ${err.message}`);

		// 重大なエラーの場合はSlackに通知
		if (err.status >= 500 || !err.status) {
			notifyError("サーバーエラー", err.message, {
				stack: err.stack,
				path: req.path,
				method: req.method,
				ip: req.ip,
			});
		}

		res.status(err.status || 500).json({
			message: err.message || "サーバーエラーが発生しました",
		});
	},
);

// Stripe Webhook（署名検証のため、rawBodyを保持する必要がある）
app.post(
	"/stripe/webhook",
	express.raw({ type: "application/json" }),
	stripeWebhook,
);

// サーバー起動
const PORT = config.port || 3000;
app.listen(PORT, () => {
	logger.info(`LINE Botサービスが起動しました - ポート: ${PORT}`);
});

export default app;
