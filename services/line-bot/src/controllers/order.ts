import { Request, Response } from "express";
import {
	PrismaClient,
	OrderStatus,
	ShirtSize,
	ShirtColor,
} from "@prisma/client";

const prisma = new PrismaClient();

// 注文一覧を取得するコントローラー
export const getOrders = async (req: Request, res: Response) => {
	try {
		const {
			page = 1,
			limit = 10,
			status,
			search,
			shirtSize,
			shirtColor,
			isHighPriority,
			hasPrintingIssue,
			startDate,
			endDate,
			sortBy = "createdAt",
			sortOrder = "desc",
		} = req.query;

		// ページネーションの設定
		const skip = (Number(page) - 1) * Number(limit);
		const take = Number(limit);

		// フィルター条件の構築
		let where: any = {};

		// ステータスフィルター
		if (status) {
			where.status = status as OrderStatus;
		}

		// シャツサイズフィルター
		if (shirtSize) {
			where.shirtSize = shirtSize as ShirtSize;
		}

		// シャツカラーフィルター
		if (shirtColor) {
			where.shirtColor = shirtColor as ShirtColor;
		}

		// 優先度フィルター
		if (isHighPriority === "true") {
			where.isHighPriority = true;
		}

		// 印刷問題フィルター
		if (hasPrintingIssue === "true") {
			where.hasPrintingIssue = true;
		}

		// 日付範囲フィルター
		if (startDate) {
			where.createdAt = {
				...(where.createdAt || {}),
				gte: new Date(startDate as string),
			};
		}

		if (endDate) {
			where.createdAt = {
				...(where.createdAt || {}),
				lte: new Date(endDate as string),
			};
		}

		// 検索フィルター（注文番号、受取人名、電話番号など）
		if (search) {
			where.OR = [
				{ orderNumber: { contains: search as string } },
				{ recipientName: { contains: search as string } },
				{ recipientPhone: { contains: search as string } },
				{ postalCode: { contains: search as string } },
			];
		}

		// ソート設定
		const orderBy: any = {};
		orderBy[sortBy as string] = sortOrder;

		// 注文一覧の取得（件数も併せて取得）
		const [orders, total] = await Promise.all([
			prisma.order.findMany({
				where,
				orderBy,
				skip,
				take,
				select: {
					id: true,
					orderNumber: true,
					status: true,
					shirtSize: true,
					shirtColor: true,
					quantity: true,
					price: true,
					createdAt: true,
					updatedAt: true,
					recipientName: true,
					isHighPriority: true,
					hasPrintingIssue: true,
					user: {
						select: {
							id: true,
							lineUserId: true,
							displayName: true,
						},
					},
					image: {
						select: {
							id: true,
							ghibliImagePath: true,
						},
					},
				},
			}),
			prisma.order.count({ where }),
		]);

		// ページネーション情報を含めたレスポンス
		return res.status(200).json({
			orders,
			pagination: {
				total,
				page: Number(page),
				limit: Number(limit),
				totalPages: Math.ceil(total / Number(limit)),
			},
		});
	} catch (error) {
		console.error("注文一覧取得エラー:", error);
		return res.status(500).json({ message: "サーバーエラーが発生しました" });
	}
};

// 注文詳細を取得するコントローラー
export const getOrderById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const order = await prisma.order.findUnique({
			where: { id: Number(id) },
			include: {
				user: {
					select: {
						id: true,
						lineUserId: true,
						displayName: true,
						profileImageUrl: true,
					},
				},
				image: true,
				payments: true,
				orderHistories: {
					orderBy: { createdAt: "desc" },
				},
			},
		});

		if (!order) {
			return res.status(404).json({ message: "注文が見つかりません" });
		}

		return res.status(200).json({ order });
	} catch (error) {
		console.error("注文詳細取得エラー:", error);
		return res.status(500).json({ message: "サーバーエラーが発生しました" });
	}
};

// 注文ステータスを更新するコントローラー
export const updateOrderStatus = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { status, adminMemo } = req.body;

		// ステータスの型チェック
		if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
			return res.status(400).json({ message: "無効なステータスです" });
		}

		// 注文の存在確認
		const order = await prisma.order.findUnique({
			where: { id: Number(id) },
		});

		if (!order) {
			return res.status(404).json({ message: "注文が見つかりません" });
		}

		// トランザクションで注文更新と履歴追加を実行
		const result = await prisma.$transaction(async (tx) => {
			// 注文ステータスの更新
			const updatedOrder = await tx.order.update({
				where: { id: Number(id) },
				data: {
					status: status as OrderStatus,
					...(adminMemo && { adminMemo }),
				},
			});

			// 注文履歴の追加
			await tx.orderHistory.create({
				data: {
					orderId: updatedOrder.id,
					status: status as OrderStatus,
					message: `ステータスを ${status} に更新しました`,
					createdBy: req.user?.userId.toString() || "system",
				},
			});

			return updatedOrder;
		});

		return res.status(200).json({
			message: "注文ステータスを更新しました",
			order: result,
		});
	} catch (error) {
		console.error("注文ステータス更新エラー:", error);
		return res.status(500).json({ message: "サーバーエラーが発生しました" });
	}
};

// 発送情報を更新するコントローラー
export const updateOrderShipping = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { shippingCarrier, trackingNumber, shippedAt, estimatedDeliveryAt } =
			req.body;

		// 必須フィールドのチェック
		if (!shippingCarrier || !trackingNumber) {
			return res.status(400).json({ message: "配送業者と追跡番号は必須です" });
		}

		// 注文の存在確認
		const order = await prisma.order.findUnique({
			where: { id: Number(id) },
		});

		if (!order) {
			return res.status(404).json({ message: "注文が見つかりません" });
		}

		// トランザクションで注文更新と履歴追加を実行
		const result = await prisma.$transaction(async (tx) => {
			// 発送情報の更新
			const updatedOrder = await tx.order.update({
				where: { id: Number(id) },
				data: {
					shippingCarrier,
					trackingNumber,
					...(shippedAt && { shippedAt: new Date(shippedAt) }),
					...(estimatedDeliveryAt && {
						estimatedDeliveryAt: new Date(estimatedDeliveryAt),
					}),
					status: OrderStatus.shipped, // 発送情報が更新されたので、ステータスも「発送済み」に更新
					notifiedShipping: false, // 発送通知フラグをリセット（後で通知処理で使用）
				},
			});

			// 注文履歴の追加
			await tx.orderHistory.create({
				data: {
					orderId: updatedOrder.id,
					status: OrderStatus.shipped,
					message: `発送情報を更新しました: ${shippingCarrier}, 追跡番号: ${trackingNumber}`,
					createdBy: req.user?.userId.toString() || "system",
				},
			});

			return updatedOrder;
		});

		return res.status(200).json({
			message: "発送情報を更新しました",
			order: result,
		});
	} catch (error) {
		console.error("発送情報更新エラー:", error);
		return res.status(500).json({ message: "サーバーエラーが発生しました" });
	}
};
