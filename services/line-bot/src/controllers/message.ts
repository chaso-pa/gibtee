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
import {
	createTshirtPreviewFlex,
	createColorSelectionFlex,
} from "../services/flex-message.js";
import { getS3SignedUrl } from "../utils/s3.js";
import { lineClient } from "../services/line.js";

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
		case ConversationState.TSHIRT_PREVIEW:
			// Tシャツプレビュー状態での処理
			if (text === "Tシャツにする") {
				await handleTshirtCreationRequest(userId, context);
			} else if (text === "やり直す") {
				await sendTextMessage(userId, "別の写真を送ってください！");
				await updateUserConversationState(userId, ConversationState.WAITING);
			} else if (text === "色を変更する") {
				await handleColorSelectionRequest(userId, context);
			} else {
				await sendTextMessage(
					userId,
					"ボタンから選択してください。または別の写真を送ってみましょう！",
				);
			}
			break;

		case ConversationState.COLOR_SELECTION:
			// 色選択状態での処理
			await handleColorSelection(userId, text, context);
			break;

		case ConversationState.SIZE_SELECTION:
			// サイズ選択の処理
			await handleSizeSelection(userId, text, context);
			break;

		case ConversationState.QUANTITY_SELECTION:
			// 数量選択の処理
			await handleQuantitySelection(userId, text, context);
			break;

		case ConversationState.INITIAL_GREETING:
			// 初回挨拶後は待機状態へ
			await sendTextMessage(
				userId,
				"ジブリ風に変換したい写真を送ってください！",
			);
			await updateUserConversationState(userId, ConversationState.WAITING);
			break;

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
 * Tシャツ作成リクエストを処理する
 */
const handleTshirtCreationRequest = async (
	userId: string,
	context: any,
): Promise<void> => {
	try {
		logger.info(`Tシャツ作成リクエスト処理: ${userId}`);

		if (!context.ghibliImageKey) {
			throw new Error("画像キーが見つかりません");
		}

		// Tシャツプレビューを生成（MCPではオリジナル画像をそのまま使用）
		const previewImageUrl = await getS3SignedUrl(
			context.ghibliImageKey,
			24 * 60 * 60,
		);

		// デフォルトカラー（白）のTシャツプレビューを送信
		const tshirtPreviewFlex = createTshirtPreviewFlex(previewImageUrl, "white");
		await lineClient.pushMessage(userId, tshirtPreviewFlex);

		// コンテキストに選択された色を追加
		context.selectedColor = "white";
		await updateUserConversationState(
			userId,
			ConversationState.SIZE_SELECTION,
			context,
		);
	} catch (error: any) {
		logger.error(`Tシャツ作成リクエスト処理エラー: ${error.message}`);
		await sendTextMessage(
			userId,
			"申し訳ありません。Tシャツプレビューの生成に失敗しました。もう一度試してみてください。",
		);
		await updateUserConversationState(userId, ConversationState.WAITING);
	}
};

/**
 * 色選択リクエストを処理する
 */
const handleColorSelectionRequest = async (
	userId: string,
	context: any,
): Promise<void> => {
	try {
		logger.info(`色選択リクエスト処理: ${userId}`);

		// 色選択Flexメッセージを送信
		const colorSelectionFlex = createColorSelectionFlex();
		await lineClient.pushMessage(userId, colorSelectionFlex);

		// 会話状態を色選択に更新
		await updateUserConversationState(
			userId,
			ConversationState.COLOR_SELECTION,
			context,
		);
	} catch (error: any) {
		logger.error(`色選択リクエスト処理エラー: ${error.message}`);
		await sendTextMessage(
			userId,
			"申し訳ありません。色選択の表示に失敗しました。もう一度試してみてください。",
		);
	}
};

/**
 * 色選択を処理する
 */
const handleColorSelection = async (
	userId: string,
	text: string,
	context: any,
): Promise<void> => {
	try {
		logger.info(`色選択処理: ${userId}, 選択: ${text}`);

		// 選択された色を取得
		let selectedColor = "white";
		if (text.includes("ブラック")) selectedColor = "black";
		else if (text.includes("ネイビー")) selectedColor = "navy";
		else if (text.includes("レッド")) selectedColor = "red";
		else if (text.includes("ホワイト")) selectedColor = "white";
		else if (text.includes("戻る")) {
			// 「戻る」ボタンが押された場合
			selectedColor = context.selectedColor || "white";
		} else {
			// 不明な選択の場合
			await sendTextMessage(userId, "有効な色を選択してください。");
			return;
		}

		// 画像URLを取得
		const previewImageUrl = await getS3SignedUrl(
			context.ghibliImageKey,
			24 * 60 * 60,
		);

		// 選択された色でTシャツプレビューを更新
		const tshirtPreviewFlex = createTshirtPreviewFlex(
			previewImageUrl,
			selectedColor,
		);
		await lineClient.pushMessage(userId, tshirtPreviewFlex);

		// コンテキストに選択された色を保存
		context.selectedColor = selectedColor;
		await updateUserConversationState(
			userId,
			ConversationState.SIZE_SELECTION,
			context,
		);
	} catch (error: any) {
		logger.error(`色選択処理エラー: ${error.message}`);
		await sendTextMessage(
			userId,
			"申し訳ありません。色の適用に失敗しました。もう一度試してみてください。",
		);
	}
};

/**
 * サイズ選択処理
 */
const handleSizeSelection = async (
	userId: string,
	text: string,
	context: any,
): Promise<void> => {
	try {
		logger.info(`サイズ選択処理: ${userId}, 選択: ${text}`);

		let selectedSize = "";

		// サイズの選択を判定
		if (text.includes("S")) selectedSize = "S";
		else if (text.includes("M")) selectedSize = "M";
		else if (text.includes("L")) selectedSize = "L";
		else if (text.includes("XL")) selectedSize = "XL";

		// 「やり直す」または「色を変更する」ボタンの処理
		if (text === "やり直す") {
			await sendTextMessage(userId, "別の写真を送ってください！");
			await updateUserConversationState(userId, ConversationState.WAITING);
			return;
		} else if (text === "色を変更する") {
			await handleColorSelectionRequest(userId, context);
			return;
		} else if (!selectedSize) {
			// 有効なサイズが選択されていない場合
			await sendTextMessage(userId, "有効なサイズを選択してください。");
			return;
		}

		// コンテキストにサイズを保存
		context.selectedSize = selectedSize;

		// 数量選択案内メッセージ
		await sendTextMessage(
			userId,
			`${selectedSize}サイズが選択されました。\n\n数量を選択してください（1〜5）：\n1枚: 3,980円\n2枚: 7,500円（460円お得）\n3枚以上: 1枚あたり3,500円`,
		);

		// 会話状態を数量選択に更新
		await updateUserConversationState(
			userId,
			ConversationState.QUANTITY_SELECTION,
			context,
		);
	} catch (error: any) {
		logger.error(`サイズ選択処理エラー: ${error.message}`);
		await sendTextMessage(
			userId,
			"申し訳ありません。サイズの選択に失敗しました。もう一度試してみてください。",
		);
	}
};

/**
 * 数量選択処理
 */
const handleQuantitySelection = async (
	userId: string,
	text: string,
	context: any,
): Promise<void> => {
	try {
		logger.info(`数量選択処理: ${userId}, 選択: ${text}`);

		// テキストから数量を抽出（数字のみ抽出）
		const quantityMatch = text.match(/\d+/);
		if (!quantityMatch) {
			await sendTextMessage(userId, "有効な数量を入力してください（1〜5）。");
			return;
		}

		const quantity = parseInt(quantityMatch[0], 10);

		// 数量の検証
		if (isNaN(quantity) || quantity < 1 || quantity > 5) {
			await sendTextMessage(userId, "数量は1〜5の間で指定してください。");
			return;
		}

		// 価格計算
		let unitPrice = 3980;
		let totalPrice = 0;

		if (quantity === 1) {
			totalPrice = unitPrice;
		} else if (quantity === 2) {
			totalPrice = 7500;
			unitPrice = 3750;
		} else {
			unitPrice = 3500;
			totalPrice = unitPrice * quantity;
		}

		// コンテキストに数量と価格を保存
		context.quantity = quantity;
		context.unitPrice = unitPrice;
		context.totalPrice = totalPrice;

		// 注文確認メッセージ
		await sendTextMessage(
			userId,
			`ご注文内容の確認:\n` +
				`- デザイン: ジブリ風オリジナルTシャツ\n` +
				`- カラー: ${getColorNameJapanese(context.selectedColor)}\n` +
				`- サイズ: ${context.selectedSize}\n` +
				`- 数量: ${quantity}枚\n` +
				`- 単価: ${unitPrice.toLocaleString()}円\n` +
				`- 合計: ${totalPrice.toLocaleString()}円（税込）\n\n` +
				`MCPフェーズのため、ここで注文は完了します。実際のアプリでは、配送先情報の入力と決済処理が続きます。`,
		);

		// 会話状態を待機中に戻す（MCPフェーズでは注文処理まで実装しない）
		await updateUserConversationState(userId, ConversationState.WAITING);

		// 注文確認後の案内メッセージ
		setTimeout(async () => {
			await sendTextMessage(
				userId,
				"ご注文ありがとうございます！別の写真からTシャツを作成する場合は、再度写真を送信してください。",
			);
		}, 1000);
	} catch (error: any) {
		logger.error(`数量選択処理エラー: ${error.message}`);
		await sendTextMessage(
			userId,
			"申し訳ありません。数量の選択に失敗しました。もう一度試してみてください。",
		);
	}
};

/**
 * 色名を日本語表記に変換
 */
const getColorNameJapanese = (colorCode: string): string => {
	switch (colorCode) {
		case "white":
			return "ホワイト";
		case "black":
			return "ブラック";
		case "navy":
			return "ネイビー";
		case "red":
			return "レッド";
		default:
			return "ホワイト";
	}
};
