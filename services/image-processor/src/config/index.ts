import dotenv from "dotenv";
import path from "path";

// 環境変数の読み込み
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") });

export const config = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: parseInt(process.env.PORT || "3001", 10),

	// ロギング設定
	logging: {
		level: process.env.LOG_LEVEL || "info",
		directory: process.env.LOG_DIR || "logs",
	},

	// OpenAI設定
	openai: {
		apiKey: process.env.OPENAI_API_KEY || "",
		orgId: process.env.OPENAI_ORG_ID,
		model: process.env.OPENAI_MODEL || "gpt-4o",
		maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || "3", 10),
		timeout: parseInt(process.env.OPENAI_TIMEOUT || "60000", 10), // 60秒
	},

	// AWS設定
	aws: {
		region: process.env.AWS_REGION || "ap-southeast-1",
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
		s3Bucket: process.env.AWS_S3_BUCKET || "",
	},

	// CORS設定
	cors: {
		origin: process.env.CORS_ORIGIN || "*",
	},
};
