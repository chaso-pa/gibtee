import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./lib/prisma.js";
import routes from "./routes/index.js";

// Prismaの接続テスト
prisma
	.$connect()
	.then(() => logger.info("Prismaがデータベースに接続しました"))
	.catch((e) => logger.error(`Prisma接続エラー: ${e.message}`));

const app = express();

// ミドルウェア
app.use(helmet());
app.use(cors());
app.use(
	express.json({
		verify: (req, res, buf) => {
			// LINE Webhookの署名検証のため生のリクエストボディを保持
			(req as any).rawBody = buf;
		},
	}),
);
app.use(express.urlencoded({ extended: true }));

// ルーティング
app.use("/", routes);

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
const PORT = config.port || 3000;
app.listen(PORT, () => {
	logger.info(`LINE Botサービスが起動しました - ポート: ${PORT}`);
});

export default app;
