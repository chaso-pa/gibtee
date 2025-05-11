import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * 注文レコードを作成する
 */
export const createOrder = async (
	userId: string,
	imageId: number,
	orderData: {
		size: string;
		color: string;
		quantity: number;
		unitPrice: number;
		totalPrice: number;
		recipientName: string;
		recipientPhone: string;
		postalCode: string;
		prefecture: string;
		city: string;
		streetAddress: string;
		buildingName?: string;
	},
): Promise<{ orderId: number; orderNumber: string }> => {
	try {
		logger.info(`注文レコード作成: ${userId}`);

		// ユーザー情報を取得
		const user = await prisma.user.findUnique({
			where: { lineUserId: userId },
		});

		if (!user) {
			throw new Error("ユーザーが見つかりません");
		}

		// 注文番号の生成
		const orderNumber = generateOrderNumber();

		// 注文レコードの作成
		const order = await prisma.order.create({
			data: {
				userId: user.id,
				imageId,
				orderNumber,
				status: "pending",
				shirtSize: orderData.size as any,
				shirtColor: orderData.color as any,
				quantity: orderData.quantity,
				price: orderData.totalPrice,
				recipientName: orderData.recipientName,
				recipientPhone: orderData.recipientPhone,
				postalCode: orderData.postalCode,
				prefecture: orderData.prefecture,
				city: orderData.city,
				streetAddress: orderData.streetAddress,
				buildingName: orderData.buildingName,
			},
		});

		logger.info(`注文レコード作成成功: ${order.id}, 注文番号: ${orderNumber}`);

		return {
			orderId: order.id,
			orderNumber,
		};
	} catch (error: any) {
		logger.error(`注文レコード作成エラー: ${error.message}`);
		throw new Error(`注文の作成に失敗しました: ${error.message}`);
	}
};

/**
 * 注文番号を生成する
 */
const generateOrderNumber = (): string => {
	// 現在日時からYYMMDD形式の文字列を生成
	const now = new Date();
	const year = now.getFullYear().toString().slice(-2);
	const month = (now.getMonth() + 1).toString().padStart(2, "0");
	const day = now.getDate().toString().padStart(2, "0");

	// ランダム文字列の生成（UUIDの最初の6文字）
	const random = uuidv4().split("-")[0].substring(0, 6);

	// 注文番号の形式: YYMMDD-XXXXXX
	return `${year}${month}${day}-${random.toUpperCase()}`;
};

/**
 * 注文ステータスを更新する
 */
export const updateOrderStatus = async (
	orderNumber: string,
	status: string,
): Promise<void> => {
	try {
		await prisma.order.update({
			where: { orderNumber },
			data: { status: status as any },
		});

		logger.info(`注文ステータス更新: ${orderNumber}, ステータス: ${status}`);
	} catch (error: any) {
		logger.error(`注文ステータス更新エラー: ${error.message}`);
		throw new Error(`注文ステータスの更新に失敗しました: ${error.message}`);
	}
};
