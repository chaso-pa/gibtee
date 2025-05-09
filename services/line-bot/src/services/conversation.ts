import { WebhookEvent } from "@line/bot-sdk";
import { prisma } from "../lib/prisma.js"; // .js拡張子に注意
import { logger } from "../utils/logger.js";

// 会話状態の定義
export enum ConversationState {
	INITIAL_GREETING = "INITIAL_GREETING",
	WAITING = "WAITING",
	HELP = "HELP",
	FAQ = "FAQ",
	PHOTO_RECEIVED = "PHOTO_RECEIVED",
	IMAGE_PROCESSING = "IMAGE_PROCESSING",
	TSHIRT_PREVIEW = "TSHIRT_PREVIEW",
	SIZE_SELECTION = "SIZE_SELECTION",
	QUANTITY_SELECTION = "QUANTITY_SELECTION",
	ADDRESS_INPUT = "ADDRESS_INPUT",
	PAYMENT_PROCESSING = "PAYMENT_PROCESSING",
	ORDER_COMPLETED = "ORDER_COMPLETED",
	ORDER_STATUS = "ORDER_STATUS",
}

/**
 * ユーザーの会話状態を取得する
 */
export const getUserConversationState = async (
	lineUserId: string,
): Promise<{
	state: ConversationState;
	context: any;
}> => {
	try {
		// ユーザー情報を取得
		const user = await prisma.user.findUnique({
			where: { lineUserId },
		});

		if (!user) {
			logger.error(`ユーザーが見つかりません: ${lineUserId}`);
			// デフォルトの会話状態を返す
			return {
				state: ConversationState.INITIAL_GREETING,
				context: {},
			};
		}

		// 会話状態を取得
		const conversation = await prisma.conversation.findFirst({
			where: { userId: user.id },
			orderBy: { updatedAt: "desc" },
		});

		// 会話状態がない場合は初期状態を返す
		if (!conversation) {
			return {
				state: ConversationState.INITIAL_GREETING,
				context: {},
			};
		}

		return {
			state: conversation.state as ConversationState,
			context: conversation.context || {},
		};
	} catch (error: any) {
		logger.error(`会話状態取得エラー: ${error.message}`);
		// エラー時もデフォルト状態を返す
		return {
			state: ConversationState.WAITING,
			context: {},
		};
	}
};

/**
 * ユーザーの会話状態を更新する
 */
export const updateUserConversationState = async (
	lineUserId: string,
	state: ConversationState,
	context: any = {},
): Promise<void> => {
	try {
		// ユーザー情報を取得
		const user = await prisma.user.findUnique({
			where: { lineUserId },
			include: {
				conversations: {
					orderBy: { updatedAt: "desc" },
					take: 1,
				},
			},
		});

		if (!user) {
			logger.error(`ユーザーが見つかりません: ${lineUserId}`);
			return;
		}

		// 会話状態を更新または作成
		await prisma.conversation.upsert({
			where: {
				id: user.Conversation?.[0]?.id || 0,
			},
			update: {
				state,
				context: context as any,
			},
			create: {
				userId: user.id,
				state,
				context: context as any,
			},
		});

		logger.info(`会話状態更新: ${lineUserId}, ${state}`);
	} catch (error: any) {
		logger.error(`会話状態更新エラー: ${error.message}`);
		throw error;
	}
};

/**
 * ユーザーの会話履歴を保存する
 */
export const saveUserConversation = async (
	userId: string,
	event: WebhookEvent,
): Promise<void> => {
	try {
		// 会話履歴をログに記録
		logger.info(`会話履歴: ${userId} - ${JSON.stringify(event)}`);

		// 将来的には会話履歴もデータベースに保存する機能を実装可能
	} catch (error: any) {
		logger.error(`会話履歴保存エラー: ${error.message}`);
	}
};
