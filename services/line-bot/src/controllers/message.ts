import {
	MessageEvent,
	TextEventMessage,
	ImageEventMessage,
} from "@line/bot-sdk";
import { logger } from "../utils/logger.js";
import { sendTextMessage } from "../services/line.js";
import {
	getUserConversationState,
	updateUserConversationState,
	saveUserConversation,
	ConversationState,
} from "../services/conversation.js";
import { handleImageMessage } from "../services/image.js";
import { handleHelpCommand, handleFaqCommand } from "../services/commands.js";

export const handleMessage = async (event: MessageEvent): Promise<void> => {
	const { replyToken, source, message } = event;
	const userId = source.userId as string;

	try {
		// 会話状態を取得
		const { state, context } = await getUserConversationState(userId);
		logger.info(`現在の会話状態: ${userId} - ${state}`);

		// メッセージタイプに基づいて処理を分岐
		switch (message.type) {
			case "text":
				await handleTextMessage(
					userId,
					message as TextEventMessage,
					state,
					context,
				);
				break;
			case "image":
				await handleImageMessage(
					userId,
					message as ImageEventMessage,
					replyToken,
					state,
					context,
				);
				break;
			default:
				logger.info(`未対応のメッセージタイプ: ${message.type}`);
				await sendTextMessage(
					userId,
					`すみません、${message.type}タイプのメッセージには対応していません。テキストか画像を送ってください。`,
				);
				break;
		}

		// 会話履歴の保存
		await saveUserConversation(userId, event);
	} catch (error: any) {
		logger.error(`メッセージ処理エラー: ${error.message}`);
		await sendTextMessage(
			userId,
			"すみません、メッセージの処理中にエラーが発生しました。しばらく経ってからもう一度お試しください。",
		);
	}
};

/**
 * テキストメッセージを処理する
 */
const handleTextMessage = async (
	userId: string,
	message: TextEventMessage,
	currentState: ConversationState,
	context: any,
): Promise<void> => {
	const { text } = message;
	logger.info(`テキストメッセージ受信: ${text} (${userId})`);

	// テキストの内容に応じて処理を分岐
	if (text.includes("ヘルプ") || text.includes("使い方")) {
		// ヘルプコマンド処理
		await handleHelpCommand(userId);
		await updateUserConversationState(userId, ConversationState.HELP);
		return;
	}

	if (text.includes("質問") || text.includes("FAQ")) {
		// FAQ処理
		await handleFaqCommand(userId);
		await updateUserConversationState(userId, ConversationState.FAQ);
		return;
	}

	// 会話状態に基づいた処理
	switch (currentState) {
		case ConversationState.INITIAL_GREETING:
			// 初回挨拶後は待機状態へ
			await sendTextMessage(
				userId,
				"ジブリ風に変換したい写真を送ってください！",
			);
			await updateUserConversationState(userId, ConversationState.WAITING);
			break;

		case ConversationState.SIZE_SELECTION:
			// サイズ選択の処理
			await handleSizeSelection(userId, text, context);
			break;

		case ConversationState.QUANTITY_SELECTION:
			// 数量選択の処理
			await handleQuantitySelection(userId, text, context);
			break;

		// 他の状態に対する処理...

		default:
			// デフォルトの応答
			if (text.includes("こんにちは")) {
				await sendTextMessage(
					userId,
					"こんにちは！gibteeへようこそ。写真を送ってジブリ風に変換してみましょう！",
				);
			} else {
				await sendTextMessage(
					userId,
					"ジブリ風に変換したい写真を送ってください！",
				);
			}
			// 既に待機中以外の状態の場合は待機中に戻す
			if (currentState !== ConversationState.WAITING) {
				await updateUserConversationState(userId, ConversationState.WAITING);
			}
			break;
	}
};

/**
 * サイズ選択処理（スタブ実装）
 */
const handleSizeSelection = async (
	userId: string,
	text: string,
	context: any,
): Promise<void> => {
	// MCPではスタブ実装
	await sendTextMessage(
		userId,
		`サイズ ${text} を選択しました。（MCPフェーズではスタブ実装です）`,
	);
	await updateUserConversationState(userId, ConversationState.WAITING);
};

/**
 * 数量選択処理（スタブ実装）
 */
const handleQuantitySelection = async (
	userId: string,
	text: string,
	context: any,
): Promise<void> => {
	// MCPではスタブ実装
	await sendTextMessage(
		userId,
		`数量 ${text} を選択しました。（MCPフェーズではスタブ実装です）`,
	);
	await updateUserConversationState(userId, ConversationState.WAITING);
};
