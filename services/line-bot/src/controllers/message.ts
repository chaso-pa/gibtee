import {
	MessageEvent,
	TextEventMessage,
	ImageEventMessage,
} from "@line/bot-sdk";
import { logger } from "../utils/logger";
import { sendTextMessage } from "../services/line";
import { saveUserConversation } from "../services/conversation";
import { handleImageMessage } from "../services/image";

export const handleMessage = async (event: MessageEvent): Promise<void> => {
	const { replyToken, source, message } = event;
	const userId = source.userId as string;

	try {
		// メッセージタイプに基づいて処理を分岐
		switch (message.type) {
			case "text":
				await handleTextMessage(userId, message as TextEventMessage);
				break;
			case "image":
				await handleImageMessage(
					userId,
					message as ImageEventMessage,
					replyToken,
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
): Promise<void> => {
	const { text } = message;
	logger.info(`テキストメッセージ受信: ${text} (${userId})`);

	// ここに会話フローに基づいた処理を実装
	// 例: 簡単な応答
	if (text.includes("こんにちは")) {
		await sendTextMessage(
			userId,
			"こんにちは！gibteeへようこそ。写真を送ってジブリ風に変換してみましょう！",
		);
	} else if (text.includes("ヘルプ") || text.includes("使い方")) {
		await sendTextMessage(
			userId,
			"gibteeの使い方:\n1. ジブリ風に変換したい写真を送ってください\n2. 変換された画像をTシャツにプレビューします\n3. サイズと数量を選んで注文できます",
		);
	} else {
		await sendTextMessage(userId, "ジブリ風に変換したい写真を送ってください！");
	}
};
