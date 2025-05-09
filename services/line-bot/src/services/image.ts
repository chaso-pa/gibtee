import { ImageEventMessage } from "@line/bot-sdk";
import axios from "axios";
import { lineClient } from "./line";
import { config } from "../config";
import { logger } from "../utils/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * LINE画像メッセージを処理する
 */
export const handleImageMessage = async (
	userId: string,
	message: ImageEventMessage,
	replyToken: string,
): Promise<void> => {
	try {
		logger.info(`画像メッセージ受信: ${message.id} (${userId})`);

		// 1. LINEプラットフォームから画像コンテンツを取得
		const stream = await lineClient.getMessageContent(message.id);

		// 2. バイナリデータを取得
		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(Buffer.from(chunk));
		}
		const imageBuffer = Buffer.concat(chunks);

		// 3. Base64エンコーディング
		const base64Image = imageBuffer.toString("base64");

		// 4. ユーザーに処理中メッセージを送信
		await lineClient.replyMessage(replyToken, {
			type: "text",
			text: "画像を受け取りました！ジブリ風に変換中です...",
		});

		// 5. 画像データをデータベースに保存
		const user = await prisma.user.findUnique({
			where: { lineUserId: userId },
		});

		if (!user) {
			throw new Error("ユーザーが見つかりません");
		}

		// 仮の画像パスを生成（実際には画像処理サービスで保存）
		const originalImagePath = `users/${userId}/images/${Date.now()}_original.jpg`;

		// 画像レコードを作成
		const image = await prisma.image.create({
			data: {
				userId: user.id,
				originalImagePath: originalImagePath,
				status: "pending",
			},
		});

		// 6. MCPフェーズでは画像処理サービスへの連携を擬似的に表現
		// 実際の実装ではここで画像処理サービスへリクエストを送信

		logger.info(`画像処理サービス呼び出し予定: imageId=${image.id}`);

		// 疑似的な遅延処理（実際の実装では削除）
		setTimeout(async () => {
			try {
				// 処理完了後の応答（実際の実装ではコールバックかWebhookで受け取る）
				await lineClient.pushMessage(userId, {
					type: "text",
					text: "【デモ】ジブリ風変換が完了しました！（実際の画像処理は後のスプリントで実装されます）",
				});
			} catch (err) {
				logger.error("疑似レスポンスエラー:", err);
			}
		}, 3000);
	} catch (error: any) {
		logger.error(`画像処理エラー: ${error.message}`);

		// エラー時の応答
		await lineClient.pushMessage(userId, {
			type: "text",
			text: "申し訳ありません。画像の処理中にエラーが発生しました。しばらく経ってからもう一度お試しください。",
		});
	}
};

/**
 * 画像処理サービスに画像変換をリクエスト
 * (次のスプリントで実装予定)
 */
export const requestImageConversion = async (
	imageId: number,
	base64Image: string,
) => {
	// 次のスプリントで実装予定
};
