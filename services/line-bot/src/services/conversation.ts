import { WebhookEvent } from "@line/bot-sdk";
import { logger } from "../utils/logger";

/**
 * ユーザーの会話履歴を保存する
 * 注: このMCP版では簡易的な実装。将来的にはデータベースに保存する
 */
export const saveUserConversation = async (
	userId: string,
	event: WebhookEvent,
): Promise<void> => {
	try {
		// 現段階では会話履歴をログに残すだけの簡易実装
		logger.info(`会話履歴: ${userId} - ${JSON.stringify(event)}`);

		// 将来的にはPrismaを使用してデータベースに保存
		// 例: await prisma.conversation.create({ ... })
	} catch (error: any) {
		logger.error(`会話履歴保存エラー: ${error.message}`);
	}
};
