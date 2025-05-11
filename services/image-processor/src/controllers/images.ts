import { Request, Response } from "express";
import { convertToGhibliStyle, withRetry } from "../services/openai.js";
import { resizeImage, convertImageFormat } from "../utils/image.js";
import {
	uploadBufferToS3,
	generateSignedUrl,
	getObjectFromS3,
} from "../utils/s3.js";
import {
	generateTshirtPreview,
	normalizeColor,
	normalizeSize,
} from "../services/tshirt-preview.js";
import { logger } from "../utils/logger.js";

/**
 * 画像をジブリ風に変換する
 */
export const convertImage = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		// リクエストからオリジナル画像のキーを取得
		const { imageKey, userId } = req.body;

		if (!imageKey) {
			res.status(400).json({ error: "画像キーが指定されていません" });
			return;
		}

		// S3から画像を取得
		logger.info(`S3から画像を取得: ${imageKey}`);
		const imageBuffer = await getObjectFromS3(imageKey);

		// 画像をリサイズ（必要に応じて）
		const resizedBuffer = await resizeImage(imageBuffer, 1024, 1024);

		// OpenAI API でジブリ風に変換
		logger.info("画像変換処理を開始");
		const convertedImageBuffer = await withRetry(() =>
			convertToGhibliStyle(resizedBuffer),
		);

		// 変換された画像をS3にアップロード
		const userPrefix = userId ? `users/${userId}/images/` : "images/";
		const convertedImageKey = await uploadBufferToS3(
			convertedImageBuffer,
			"ghibli_converted.jpg",
			userPrefix,
		);

		// 署名付きURLを生成
		const signedUrl = await generateSignedUrl(convertedImageKey, 24 * 60 * 60);

		// レスポンスを返す
		res.status(200).json({
			success: true,
			originalImageKey: imageKey,
			convertedImageKey,
			signedUrl,
		});
	} catch (error: any) {
		logger.error(`画像変換エラー: ${error.message}`);
		res.status(500).json({
			error: "画像変換中にエラーが発生しました",
			message: error.message,
		});
	}
};

/**
 * Tシャツプレビューを生成する
 */
export const generateTshirtPreviewController = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { imageKey, color, size, userId } = req.body;

		if (!imageKey) {
			res.status(400).json({ error: "画像キーが指定されていません" });
			return;
		}

		// S3から画像を取得
		logger.info(`S3から画像を取得: ${imageKey}`);
		const imageBuffer = await getObjectFromS3(imageKey);

		// カラーと、サイズの標準化
		const normalizedColor = normalizeColor(color || "white");
		const normalizedSize = normalizeSize(size || "M");

		// Tシャツプレビューを生成
		const previewBuffer = await generateTshirtPreview(
			imageBuffer,
			normalizedColor,
			normalizedSize,
		);

		// プレビュー画像をS3にアップロード
		const userPrefix = userId ? `users/${userId}/previews/` : "previews/";
		const previewImageKey = await uploadBufferToS3(
			previewBuffer,
			`tshirt_preview_${normalizedColor}_${normalizedSize}.png`,
			userPrefix,
		);

		// 署名付きURLを生成
		const signedUrl = await generateSignedUrl(previewImageKey, 24 * 60 * 60);

		// レスポンスを返す
		res.status(200).json({
			success: true,
			originalImageKey: imageKey,
			previewImageKey,
			signedUrl,
			color: normalizedColor,
			size: normalizedSize,
		});
	} catch (error: any) {
		logger.error(`Tシャツプレビュー生成エラー: ${error.message}`);
		res.status(500).json({
			error: "Tシャツプレビュー生成中にエラーが発生しました",
			message: error.message,
		});
	}
};
