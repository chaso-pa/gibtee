import { ImageEventMessage } from "@line/bot-sdk";
import { lineClient } from "./line.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../lib/prisma.js";
import { uploadBufferToS3, getS3SignedUrl } from "../utils/s3.js";
import {
	updateUserConversationState,
	ConversationState,
} from "./conversation.js";

/**
 * LINE画像メッセージを処理する
 */
export const handleImageMessage = async (
	userId: string,
	message: ImageEventMessage,
	replyToken: string,
	currentState: ConversationState,
	context: any,
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

		// 3. ユーザーに処理中メッセージを送信
		await lineClient.replyMessage(replyToken, {
			type: "text",
			text: "画像を受け取りました！ジブリ風に変換中です...",
		});

		// 4. ユーザー情報を取得
		const user = await prisma.user.findUnique({
			where: { lineUserId: userId },
		});

		if (!user) {
			throw new Error("ユーザーが見つかりません");
		}

		// 5. S3バケットに画像をアップロード
		const timestamp = Date.now();
		const originalImageKey = await uploadBufferToS3(
			imageBuffer,
			`${timestamp}_original.jpg`,
			`users/${userId}/images/`,
		);

		// 6. 署名付きURLを生成（24時間有効）
		const originalImageUrl = await getS3SignedUrl(
			originalImageKey,
			24 * 60 * 60,
		);

		// 7. 画像レコードをデータベースに保存
		const image = await prisma.image.create({
			data: {
				userId: user.id,
				originalImagePath: originalImageKey,
				status: "pending",
			},
		});

		logger.info(`画像レコード作成: ${image.id}, パス: ${originalImageKey}`);

		// 8. 会話状態を更新
		await updateUserConversationState(
			userId,
			ConversationState.IMAGE_PROCESSING,
			{
				imageId: image.id,
				originalImageKey, // URLではなくキーを保存
			},
		);

		// 9. MCPフェーズでは画像処理サービスへの連携を擬似的に表現
		// 実際の実装ではここで画像処理サービスへリクエストを送信

		logger.info(`画像処理サービス呼び出し予定: imageId=${image.id}`);

		// 疑似的な遅延処理（実際の実装では削除）
		setTimeout(async () => {
			try {
				// 変換されたジブリ風画像のURLをS3から取得する代わりに、オリジナル画像のURLを再利用（MCPフェーズのみ）
				// 署名付きURLは一時的なので、必要なタイミングで再生成
				const ghibliImageUrl = await getS3SignedUrl(
					originalImageKey,
					24 * 60 * 60,
				);

				// 変換処理完了の通知
				await lineClient.pushMessage(userId, {
					type: "text",
					text: "【デモ】ジブリ風変換が完了しました！下記が変換後の画像です。\n\n※MCPフェーズでは元画像をそのまま表示しています。",
				});

				// 画像メッセージの送信
				await lineClient.pushMessage(userId, {
					type: "image",
					originalContentUrl: ghibliImageUrl,
					previewImageUrl: ghibliImageUrl,
				});

				// 会話状態をプレビュー状態に更新
				await updateUserConversationState(
					userId,
					ConversationState.TSHIRT_PREVIEW,
					{
						imageId: image.id,
						originalImageKey, // URLではなくキーを保存
					},
				);

				// Tシャツ選択肢を提示（スタブ実装）
				await lineClient.pushMessage(userId, {
					type: "text",
					text: "Tシャツのサイズを選択してください：\nS / M / L / XL\n\n（MCPフェーズではテキストで「S」などと入力してください）",
				});

				// 会話状態をサイズ選択に更新
				await updateUserConversationState(
					userId,
					ConversationState.SIZE_SELECTION,
					{
						imageId: image.id,
						originalImageKey, // URLではなくキーを保存
					},
				);
			} catch (err: any) {
				logger.error(`疑似レスポンスエラー: ${err.message}`);
			}
		}, 3000);
	} catch (error: any) {
		logger.error(`画像処理エラー: ${error.message}`);

		// エラー時の応答
		await lineClient.pushMessage(userId, {
			type: "text",
			text: "申し訳ありません。画像の処理中にエラーが発生しました。しばらく経ってからもう一度お試しください。",
		});

		// 会話状態をリセット
		await updateUserConversationState(userId, ConversationState.WAITING);
	}
};
