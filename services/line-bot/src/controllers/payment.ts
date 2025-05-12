import { FlexMessage } from "@line/bot-sdk";
import { logger } from "../utils/logger.js";
import { lineClient } from "../services/line.js";
import {
	createPaymentRequest,
	processCreditCardPayment,
} from "../services/payment.js";
import { prisma } from "../lib/prisma.js";

/**
 * LINE Pay決済を開始する
 */
export const startLinePayPayment = async (
	userId: string,
	orderNumber: string,
): Promise<void> => {
	try {
		logger.info(`LINE Pay決済開始: ${orderNumber}`);

		// 注文情報の取得
		const order = await prisma.order.findUnique({
			where: { orderNumber },
		});

		if (!order) {
			throw new Error("注文が見つかりません");
		}

		// 画像情報の取得
		const image = await prisma.image.findUnique({
			where: { id: order.imageId },
		});

		if (!image) {
			throw new Error("画像情報が見つかりません");
		}

		// 商品名の設定
		const productName = `ジブリ風Tシャツ (${order.shirtColor} / ${order.shirtSize})`;

		// LINE Pay決済リクエストの作成
		const { paymentUrl, transactionId } = await createPaymentRequest(
			orderNumber,
			order.price.toNumber(),
			productName,
			userId,
		);

		// ユーザーに決済URLを送信
		const message: FlexMessage = {
			type: "flex",
			altText: "LINE Payで決済を完了してください",
			contents: {
				type: "bubble",
				header: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "決済手続きへ",
							weight: "bold",
							size: "xl",
							align: "center",
						},
					],
					paddingTop: "md",
					paddingBottom: "md",
				},
				body: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "LINE Payで決済を完了してください",
							wrap: true,
							size: "md",
						},
						{
							type: "text",
							text: `金額: ${order.price.toLocaleString()}円`,
							margin: "md",
							size: "md",
						},
						{
							type: "text",
							text: `注文番号: ${orderNumber}`,
							margin: "sm",
							size: "sm",
							color: "#888888",
						},
					],
					paddingAll: "12px",
				},
				footer: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "button",
							action: {
								type: "uri",
								label: "LINE Payで支払う",
								uri: paymentUrl,
							},
							style: "primary",
						},
					],
					paddingAll: "12px",
				},
			},
		};

		await lineClient.pushMessage(userId, message);

		logger.info(`LINE Pay決済URL送信: ${orderNumber}, ユーザーID: ${userId}`);
	} catch (error: any) {
		logger.error(`LINE Pay決済開始エラー: ${error.message}`);

		// エラーメッセージをユーザーに送信
		await lineClient.pushMessage(userId, {
			type: "text",
			text: `決済の準備に失敗しました。お手数ですが、もう一度お試しください。\nエラー: ${error.message}`,
		});
	}
};

/**
 * クレジットカード決済のUIを表示
 */
export const showCreditCardPaymentUI = async (
	userId: string,
	orderNumber: string,
): Promise<void> => {
	try {
		logger.info(`クレジットカード決済UI表示: ${orderNumber}`);

		// 注文情報の取得
		const order = await prisma.order.findUnique({
			where: { orderNumber },
		});

		if (!order) {
			throw new Error("注文が見つかりません");
		}

		// カード情報入力用のFlexメッセージ
		// 注意: 実際のプロダクションでは、セキュリティ上の理由からLINE Bot上で直接カード情報を収集すべきではありません
		// 決済代行サービスの提供するUIを使用するべきです
		const message: FlexMessage = {
			type: "flex",
			altText: "クレジットカード情報入力",
			contents: {
				type: "bubble",
				header: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "クレジットカード決済",
							weight: "bold",
							size: "xl",
							align: "center",
						},
					],
					paddingTop: "md",
					paddingBottom: "md",
				},
				body: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "MCPフェーズのため、実際のカード情報は収集せずにシミュレーションを行います。",
							wrap: true,
							size: "md",
						},
						{
							type: "text",
							text: `金額: ${order.price.toLocaleString()}円`,
							margin: "md",
							size: "md",
						},
						{
							type: "text",
							text: `注文番号: ${orderNumber}`,
							margin: "sm",
							size: "sm",
							color: "#888888",
						},
					],
					paddingAll: "12px",
				},
				footer: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "button",
							action: {
								type: "message",
								label: "決済をシミュレート",
								text: `クレジットカード決済シミュレーション:${orderNumber}`,
							},
							style: "primary",
						},
						{
							type: "button",
							action: {
								type: "message",
								label: "キャンセル",
								text: "決済をキャンセル",
							},
							style: "secondary",
							margin: "md",
						},
					],
					paddingAll: "12px",
				},
			},
		};

		await lineClient.pushMessage(userId, message);

		logger.info(
			`クレジットカード決済UI送信: ${orderNumber}, ユーザーID: ${userId}`,
		);
	} catch (error: any) {
		logger.error(`クレジットカード決済UI表示エラー: ${error.message}`);

		// エラーメッセージをユーザーに送信
		await lineClient.pushMessage(userId, {
			type: "text",
			text: `決済画面の表示に失敗しました。お手数ですが、もう一度お試しください。\nエラー: ${error.message}`,
		});
	}
};

/**
 * クレジットカード決済のシミュレーション処理
 */
export const simulateCreditCardPayment = async (
	userId: string,
	orderNumber: string,
): Promise<void> => {
	try {
		logger.info(`クレジットカード決済シミュレーション: ${orderNumber}`);

		// 注文情報の取得
		const order = await prisma.order.findUnique({
			where: { orderNumber },
		});

		if (!order) {
			throw new Error("注文が見つかりません");
		}

		// ダミーのカード情報
		const dummyCardDetails = {
			cardNumber: "4111111111111111",
			expiryMonth: "12",
			expiryYear: "25",
			cvv: "123",
			holderName: "TEST USER",
		};

		// 決済処理
		const result = await processCreditCardPayment(
			orderNumber,
			order.price.toNumber(),
			dummyCardDetails,
			userId,
		);

		// 決済結果をユーザーに通知
		await lineClient.pushMessage(userId, {
			type: "text",
			text: `決済が完了しました。\n注文番号: ${orderNumber}\nトランザクションID: ${result.transactionId}\n\n商品の発送準備を開始します。発送状況はLINEでお知らせします。`,
		});

		logger.info(`クレジットカード決済シミュレーション成功: ${orderNumber}`);
	} catch (error: any) {
		logger.error(
			`クレジットカード決済シミュレーションエラー: ${error.message}`,
		);

		// エラーメッセージをユーザーに送信
		await lineClient.pushMessage(userId, {
			type: "text",
			text: `決済処理に失敗しました。お手数ですが、もう一度お試しください。\nエラー: ${error.message}`,
		});
	}
};
