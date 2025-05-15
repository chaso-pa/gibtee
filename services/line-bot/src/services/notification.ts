import { OrderStatus } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { sendTextMessage, sendFlexMessage } from "./line.js";
import * as flexTemplate from "./flex-message.js";

/**
 * 注文ステータス更新の通知を送信する
 * @param lineUserId LINE ユーザーID
 * @param orderNumber 注文番号
 * @param status 注文ステータス
 */
export const sendOrderStatusNotification = async (
	lineUserId: string,
	orderNumber: string,
	status: OrderStatus,
): Promise<void> => {
	try {
		// ステータスに応じた日本語のステータス名
		const statusText = getStatusText(status);

		// 基本テキストメッセージ
		const message = `ご注文 #${orderNumber} のステータスが「${statusText}」に更新されました。`;

		// Flexメッセージを作成
		const flexContent = createStatusUpdateFlexMessage(
			orderNumber,
			status,
			statusText,
		);

		// LINEへ通知送信
		await sendFlexMessage(
			lineUserId,
			`ご注文のステータスが更新されました`,
			flexContent,
		);

		logger.info(
			`注文ステータス通知送信成功: LineUserId=${lineUserId}, OrderNumber=${orderNumber}, Status=${status}`,
		);
	} catch (error) {
		logger.error(`注文ステータス通知送信エラー: ${error.message}`);
		throw error;
	}
};

/**
 * 配送情報更新の通知を送信する
 * @param lineUserId LINE ユーザーID
 * @param orderNumber 注文番号
 * @param shippingCarrier 配送業者
 * @param trackingNumber 追跡番号
 * @param shippedAt 発送日
 * @param estimatedDeliveryAt 配達予定日
 */
export const sendShippingNotification = async (
	lineUserId: string,
	orderNumber: string,
	shippingCarrier: string,
	trackingNumber: string,
	shippedAt: Date,
	estimatedDeliveryAt: Date | null,
): Promise<void> => {
	try {
		// 配送業者の表示名を取得
		const carrierName = getCarrierName(shippingCarrier);

		// 基本のテキストメッセージ
		const message = `ご注文 #${orderNumber} が発送されました。\n配送業者: ${carrierName}\n追跡番号: ${trackingNumber}`;

		// 配達予定日のテキスト
		const deliveryDateText = estimatedDeliveryAt
			? `${formatDate(estimatedDeliveryAt)}頃のお届け予定です。`
			: "";

		// Flexメッセージを作成
		const flexContent = createShippingFlexMessage(
			orderNumber,
			carrierName,
			trackingNumber,
			formatDate(shippedAt),
			estimatedDeliveryAt ? formatDate(estimatedDeliveryAt) : null,
		);

		// LINEへ通知送信
		await sendFlexMessage(lineUserId, `ご注文が発送されました`, flexContent);

		logger.info(
			`配送情報通知送信成功: LineUserId=${lineUserId}, OrderNumber=${orderNumber}, Carrier=${shippingCarrier}`,
		);
	} catch (error) {
		logger.error(`配送情報通知送信エラー: ${error.message}`);
		throw error;
	}
};

/**
 * 注文ステータスの日本語表示を取得
 */
const getStatusText = (status: OrderStatus): string => {
	switch (status) {
		case OrderStatus.pending:
			return "処理待ち";
		case OrderStatus.paid:
			return "支払完了";
		case OrderStatus.processing:
			return "処理中";
		case OrderStatus.printing:
			return "印刷中";
		case OrderStatus.shipped:
			return "発送完了";
		case OrderStatus.delivered:
			return "配達完了";
		case OrderStatus.cancelled:
			return "キャンセル";
		default:
			return status;
	}
};

/**
 * 配送業者の表示名を取得
 */
const getCarrierName = (carrier: string): string => {
	switch (carrier) {
		case "yamato":
			return "ヤマト運輸";
		case "sagawa":
			return "佐川急便";
		case "japan_post":
			return "日本郵便";
		default:
			return carrier;
	}
};

/**
 * 日付フォーマット（YYYY/MM/DD）
 */
const formatDate = (date: Date): string => {
	return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
};

/**
 * ステータス更新用のFlex messageを作成
 */
const createStatusUpdateFlexMessage = (
	orderNumber: string,
	status: OrderStatus,
	statusText: string,
) => {
	// ステータスに応じた色とアイコン
	const statusColor = getStatusColor(status);
	const statusIcon = getStatusIcon(status);

	return {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "注文状況更新のお知らせ",
					weight: "bold",
					size: "lg",
					color: "#ffffff",
				},
			],
			backgroundColor: statusColor,
			paddingBottom: "10px",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: `ご注文 #${orderNumber}`,
					weight: "bold",
					size: "md",
					margin: "md",
				},
				{
					type: "box",
					layout: "vertical",
					margin: "lg",
					spacing: "sm",
					contents: [
						{
							type: "box",
							layout: "baseline",
							spacing: "sm",
							contents: [
								{
									type: "text",
									text: "ステータス",
									color: "#aaaaaa",
									size: "sm",
									flex: 1,
								},
								{
									type: "text",
									text: statusText,
									wrap: true,
									color: statusColor,
									size: "sm",
									flex: 2,
									weight: "bold",
								},
							],
						},
					],
				},
				{
					type: "box",
					layout: "vertical",
					margin: "xxl",
					contents: [
						{
							type: "text",
							text: getStatusDescription(status),
							size: "sm",
							color: "#555555",
							wrap: true,
						},
					],
				},
			],
		},
		footer: {
			type: "box",
			layout: "vertical",
			spacing: "sm",
			contents: [
				{
					type: "button",
					style: "primary",
					height: "sm",
					action: {
						type: "uri",
						label: "注文詳細を確認",
						uri: "https://gibtee.example.com/orders/view",
					},
					color: statusColor,
				},
			],
			flex: 0,
		},
	};
};

/**
 * 配送情報更新用のFlex messageを作成
 */
const createShippingFlexMessage = (
	orderNumber: string,
	carrierName: string,
	trackingNumber: string,
	shippedDate: string,
	estimatedDeliveryDate: string | null,
) => {
	return {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "発送のお知らせ",
					weight: "bold",
					size: "lg",
					color: "#ffffff",
				},
			],
			backgroundColor: "#1DB446",
			paddingBottom: "10px",
		},
		hero: {
			type: "image",
			url: "https://cdn.gibtee.example.com/assets/shipping.jpg",
			size: "full",
			aspectRatio: "20:13",
			aspectMode: "cover",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: `ご注文 #${orderNumber}`,
					weight: "bold",
					size: "md",
					margin: "md",
				},
				{
					type: "text",
					text: "ご注文の商品を発送しました！",
					size: "sm",
					color: "#555555",
					margin: "md",
				},
				{
					type: "box",
					layout: "vertical",
					margin: "lg",
					spacing: "sm",
					contents: [
						{
							type: "box",
							layout: "baseline",
							spacing: "sm",
							contents: [
								{
									type: "text",
									text: "配送業者",
									color: "#aaaaaa",
									size: "sm",
									flex: 1,
								},
								{
									type: "text",
									text: carrierName,
									wrap: true,
									color: "#666666",
									size: "sm",
									flex: 2,
								},
							],
						},
						{
							type: "box",
							layout: "baseline",
							spacing: "sm",
							contents: [
								{
									type: "text",
									text: "追跡番号",
									color: "#aaaaaa",
									size: "sm",
									flex: 1,
								},
								{
									type: "text",
									text: trackingNumber,
									wrap: true,
									color: "#666666",
									size: "sm",
									flex: 2,
								},
							],
						},
						{
							type: "box",
							layout: "baseline",
							spacing: "sm",
							contents: [
								{
									type: "text",
									text: "発送日",
									color: "#aaaaaa",
									size: "sm",
									flex: 1,
								},
								{
									type: "text",
									text: shippedDate,
									wrap: true,
									color: "#666666",
									size: "sm",
									flex: 2,
								},
							],
						},
						estimatedDeliveryDate
							? {
									type: "box",
									layout: "baseline",
									spacing: "sm",
									contents: [
										{
											type: "text",
											text: "配達予定",
											color: "#aaaaaa",
											size: "sm",
											flex: 1,
										},
										{
											type: "text",
											text: `${estimatedDeliveryDate}頃`,
											wrap: true,
											color: "#666666",
											size: "sm",
											flex: 2,
										},
									],
								}
							: null,
					].filter(Boolean),
				},
			],
		},
		footer: {
			type: "box",
			layout: "vertical",
			spacing: "sm",
			contents: [
				{
					type: "button",
					style: "primary",
					height: "sm",
					action: {
						type: "uri",
						label: "配送状況を確認",
						uri: `https://gibtee.example.com/tracking/${trackingNumber}`,
					},
				},
				{
					type: "button",
					style: "secondary",
					height: "sm",
					action: {
						type: "uri",
						label: "注文詳細を確認",
						uri: "https://gibtee.example.com/orders/view",
					},
				},
			],
			flex: 0,
		},
	};
};

/**
 * ステータスに応じた説明文を取得
 */
const getStatusDescription = (status: OrderStatus): string => {
	switch (status) {
		case OrderStatus.pending:
			return "ご注文を受け付けました。お支払いをお待ちしております。";
		case OrderStatus.paid:
			return "お支払いが完了しました。ご注文の処理を開始します。";
		case OrderStatus.processing:
			return "ご注文の処理中です。準備ができ次第、印刷工程に移ります。";
		case OrderStatus.printing:
			return "Tシャツの印刷を開始しました。印刷完了後、出荷手続きを行います。";
		case OrderStatus.shipped:
			return "ご注文の商品を発送いたしました。配送業者の追跡サービスでお荷物の状況をご確認いただけます。";
		case OrderStatus.delivered:
			return "ご注文の商品がお客様のもとに届きました。ご利用ありがとうございました。";
		case OrderStatus.cancelled:
			return "ご注文はキャンセルされました。またのご利用をお待ちしております。";
		default:
			return "ご注文の状況が更新されました。";
	}
};

/**
 * ステータスに応じた色を取得
 */
const getStatusColor = (status: OrderStatus): string => {
	switch (status) {
		case OrderStatus.pending:
			return "#888888";
		case OrderStatus.paid:
			return "#1DB446";
		case OrderStatus.processing:
			return "#1D7CB4";
		case OrderStatus.printing:
			return "#B44D1D";
		case OrderStatus.shipped:
			return "#7E1DB4";
		case OrderStatus.delivered:
			return "#1D76B4";
		case OrderStatus.cancelled:
			return "#B41D1D";
		default:
			return "#1DB446";
	}
};

/**
 * ステータスに応じたアイコンを取得
 */
const getStatusIcon = (status: OrderStatus): string => {
	switch (status) {
		case OrderStatus.pending:
			return "⏱";
		case OrderStatus.paid:
			return "💰";
		case OrderStatus.processing:
			return "🔄";
		case OrderStatus.printing:
			return "🖨";
		case OrderStatus.shipped:
			return "📦";
		case OrderStatus.delivered:
			return "✅";
		case OrderStatus.cancelled:
			return "❌";
		default:
			return "i";
	}
};
