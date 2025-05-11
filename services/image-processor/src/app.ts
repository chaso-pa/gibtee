import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";

const app = express();

// ミドルウェア
app.use(helmet());
app.use(
	cors({
		origin: config.cors.origin,
	}),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ルーティング
app.use("/api", routes);

// エラーハンドリング
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		logger.error(`Error: ${err.message}`);
		res.status(err.status || 500).json({
			message: err.message || "サーバーエラーが発生しました",
		});
	},
);

// サーバー起動
const PORT = config.port || 3001;
app.listen(PORT, () => {
	logger.info(`画像処理サービスが起動しました - ポート: ${PORT}`);
});

export default app;
