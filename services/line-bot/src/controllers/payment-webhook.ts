import { Request, Response } from "express";
import {
	checkStripeSessionStatus,
	handleStripeWebhook,
} from "../services/payment.js";
import { sendTextMessage } from "../services/line.js";
import { getUserByOrderId } from "../services/conversation.js";
import { createPaymentCompletedFlex } from "../services/flex-message.js";
import { lineClient } from "../services/line.js";
import { logger } from "../utils/logger.js";

/**
 * Stripe Webhookを処理するエンドポイント
 */
export const stripeWebhook = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const signature = req.headers["stripe-signature"] as string;

		if (!signature) {
			logger.error("Stripe署名が見つかりません");
			res.status(400).send("署名が必要です");
			return;
		}

		const success = await handleStripeWebhook(signature, req.body);

		if (success) {
			res.status(200).send("Success");
		} else {
			res.status(400).send("Webhook処理に失敗しました");
		}
	} catch (error: any) {
		logger.error(`Webhook処理エラー: ${error.message}`);
		res.status(500).send("Internal Server Error");
	}
};

/**
 * Stripe決済成功時のコールバック
 */
export const stripeSuccess = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const sessionId = req.query.session_id as string;
		const orderId = parseInt(req.query.order_id as string);

		if (!sessionId || isNaN(orderId)) {
			logger.error("無効なパラメータです");
			res.status(400).send("無効なパラメータです");
			return;
		}

		// セッションの状態を確認
		const sessionStatus = await checkStripeSessionStatus(sessionId);

		if (sessionStatus.status === "COMPLETED") {
			// ユーザーを取得
			const user = await getUserByOrderId(orderId);

			if (user && user.lineUserId) {
				// 決済完了のメッセージをLINEに送信
				const completedFlex = createPaymentCompletedFlex(
					sessionStatus.orderNumber || "",
				);
				await lineClient.pushMessage(user.lineUserId, completedFlex);
			}

			// 成功ページにリダイレクト
			res.render("payment-success", {
				orderNumber: sessionStatus.orderNumber || "",
			});
		} else {
			// エラーページにリダイレクト
			res.render("payment-error", {
				message: "決済処理に失敗しました。",
			});
		}
	} catch (error: any) {
		logger.error(`Stripe成功コールバックエラー: ${error.message}`);
		res.status(500).send("Internal Server Error");
	}
};

/**
 * Stripe決済キャンセル時のコールバック
 */
export const stripeCancel = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const orderId = parseInt(req.query.order_id as string);

		if (isNaN(orderId)) {
			logger.error("無効なパラメータです");
			res.status(400).send("無効なパラメータです");
			return;
		}

		// ユーザーを取得
		const user = await getUserByOrderId(orderId);

		if (user && user.lineUserId) {
			// キャンセルメッセージをLINEに送信
			await sendTextMessage(
				user.lineUserId,
				"決済がキャンセルされました。別の支払い方法を選択するか、注文をやり直してください。",
			);
		}

		// キャンセルページにリダイレクト
		res.render("payment-cancel", {});
	} catch (error: any) {
		logger.error(`Stripeキャンセルコールバックエラー: ${error.message}`);
		res.status(500).send("Internal Server Error");
	}
};
