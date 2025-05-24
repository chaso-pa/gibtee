// src/controllers/system-settings.ts
import { Request, Response } from "express";
import { SystemSettingsService } from "../services/system-settings.js";
import { logger } from "../utils/logger.js";

/**
 * システム設定を取得
 */
export const getSystemSettings = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const settings = await SystemSettingsService.getSettings();

		if (!settings) {
			// 設定が存在しない場合はデフォルト値を返す
			res.json({
				id: 0,
				isOrderAcceptanceEnabled: true,
				orderSuspensionMessage: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			return;
		}

		res.json(settings);
	} catch (error: any) {
		logger.error(`システム設定取得エラー: ${error.message}`);
		res.status(500).json({
			error: "システム設定の取得に失敗しました",
			details: error.message,
		});
	}
};

/**
 * システム設定を更新
 */
export const updateSystemSettings = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { isOrderAcceptanceEnabled, orderSuspensionMessage } = JSON.parse(
			req.body.body,
		);

		console.log(isOrderAcceptanceEnabled);
		// バリデーション
		if (typeof isOrderAcceptanceEnabled !== "boolean") {
			res.status(400).json({
				error: "isOrderAcceptanceEnabledはtrueかfalseである必要があります",
			});
			return;
		}

		if (
			orderSuspensionMessage !== null &&
			typeof orderSuspensionMessage !== "string"
		) {
			res.status(400).json({
				error: "orderSuspensionMessageはstring型またはnullである必要があります",
			});
			return;
		}

		// メッセージの長さチェック
		if (orderSuspensionMessage && orderSuspensionMessage.length > 500) {
			res.status(400).json({
				error: "orderSuspensionMessageは500文字以内である必要があります",
			});
			return;
		}

		const updatedSettings = await SystemSettingsService.updateSettings(
			isOrderAcceptanceEnabled,
			orderSuspensionMessage,
		);

		logger.info(`システム設定更新: 注文受付=${isOrderAcceptanceEnabled}`);

		res.json(updatedSettings);
	} catch (error: any) {
		logger.error(`システム設定更新エラー: ${error.message}`);
		res.status(500).json({
			error: "システム設定の更新に失敗しました",
			details: error.message,
		});
	}
};

/**
 * 注文受付状態のみを取得（LINEボット側で使用）
 */
export const getOrderAcceptanceStatus = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const status = await SystemSettingsService.checkOrderAcceptanceStatus();
		res.json(status);
	} catch (error: any) {
		logger.error(`注文受付状態取得エラー: ${error.message}`);
		res.status(500).json({
			error: "注文受付状態の取得に失敗しました",
			details: error.message,
		});
	}
};
