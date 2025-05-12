import axios from "axios";
import { logger } from "../utils/logger.js";

// Slackの設定
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || "#gibtee-orders";
const SLACK_USERNAME = process.env.SLACK_USERNAME || "Gibtee注文Bot";
const SLACK_ICON_EMOJI = process.env.SLACK_ICON_EMOJI || ":tshirt:";

/**
 * Slack通知を送信する
 */
export const sendSlackNotification = async (
	message: string,
	attachments: any[] = [],
	channel: string = SLACK_CHANNEL,
): Promise<void> => {
	try {
		if (!SLACK_WEBHOOK_URL) {
			logger.warn("Slack Webhook URLが設定されていません");
			return;
		}

		const payload = {
			channel,
			username: SLACK_USERNAME,
			icon_emoji: SLACK_ICON_EMOJI,
			text: message,
			attachments,
		};

		await axios.post(SLACK_WEBHOOK_URL, payload);

		logger.info(`Slack通知送信成功: ${message}`);
	} catch (error: any) {
		logger.error(`Slack通知送信エラー: ${error.message}`);
	}
};

/**
 * 新規注文のSlack通知
 */
export const notifyNewOrder = async (
	orderNumber: string,
	userId: string,
	productDetails: {
		color: string;
		size: string;
		quantity: number;
		amount: number;
	},
	shippingDetails: {
		recipientName: string;
		prefecture: string;
		city: string;
	},
): Promise<void> => {
	const colorName = getColorNameJapanese(productDetails.color);

	const message = `🎉 新規注文 #${orderNumber}`;

	const attachments = [
		{
			color: "#36a64f",
			fields: [
				{
					title: "商品",
					value: `ジブリ風Tシャツ (${colorName} / ${productDetails.size}) × ${productDetails.quantity}枚`,
					short: false,
				},
				{
					title: "金額",
					value: `${productDetails.amount.toLocaleString()}円（税込）`,
					short: true,
				},
				{
					title: "お届け先",
					value: `${shippingDetails.recipientName} 様\n${shippingDetails.prefecture}${shippingDetails.city}`,
					short: true,
				},
				{
					title: "ユーザーID",
					value: userId,
					short: true,
				},
			],
			footer: "Gibtee",
			footer_icon: "https://example.com/gibtee-icon.png",
			ts: Math.floor(Date.now() / 1000),
		},
	];

	await sendSlackNotification(message, attachments);
};

/**
 * 決済完了のSlack通知
 */
export const notifyPaymentCompleted = async (
	orderNumber: string,
	paymentMethod: string,
	amount: number,
	transactionId: string,
): Promise<void> => {
	const message = `💰 決済完了 #${orderNumber}`;

	const attachments = [
		{
			color: "#3D9DF3",
			fields: [
				{
					title: "決済方法",
					value: paymentMethod === "LINE_PAY" ? "LINE Pay" : "クレジットカード",
					short: true,
				},
				{
					title: "金額",
					value: `${amount.toLocaleString()}円`,
					short: true,
				},
				{
					title: "トランザクションID",
					value: transactionId,
					short: false,
				},
			],
			footer: "Gibtee",
			footer_icon: "https://example.com/gibtee-icon.png",
			ts: Math.floor(Date.now() / 1000),
		},
	];

	await sendSlackNotification(message, attachments);
};

/**
 * 注文ステータス更新のSlack通知
 */
export const notifyOrderStatusUpdate = async (
	orderNumber: string,
	oldStatus: string,
	newStatus: string,
): Promise<void> => {
	const statusEmoji = getStatusEmoji(newStatus);
	const statusText = getStatusText(newStatus);

	const message = `${statusEmoji} 注文ステータス更新 #${orderNumber}`;

	const attachments = [
		{
			color: "#FFA500",
			fields: [
				{
					title: "前のステータス",
					value: getStatusText(oldStatus),
					short: true,
				},
				{
					title: "新しいステータス",
					value: statusText,
					short: true,
				},
			],
			footer: "Gibtee",
			footer_icon: "https://example.com/gibtee-icon.png",
			ts: Math.floor(Date.now() / 1000),
		},
	];

	await sendSlackNotification(message, attachments);
};

/**
 * ステータスに対応する絵文字を取得
 */
const getStatusEmoji = (status: string): string => {
	switch (status) {
		case "pending":
			return "⏳";
		case "payment_pending":
			return "💳";
		case "paid":
			return "💰";
		case "preparing":
			return "🔧";
		case "shipped":
			return "📦";
		case "delivered":
			return "✅";
		case "canceled":
			return "❌";
		case "payment_failed":
			return "!";
		default:
			return "📝";
	}
};

/**
 * ステータスに対応する日本語テキストを取得
 */
const getStatusText = (status: string): string => {
	switch (status) {
		case "pending":
			return "注文受付";
		case "payment_pending":
			return "決済待ち";
		case "paid":
			return "決済完了";
		case "preparing":
			return "準備中";
		case "shipped":
			return "発送済み";
		case "delivered":
			return "配達済み";
		case "canceled":
			return "キャンセル";
		case "payment_failed":
			return "決済失敗";
		default:
			return status;
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
