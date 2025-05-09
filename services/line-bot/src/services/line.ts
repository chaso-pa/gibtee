import { Client, Message, TextMessage, ImageMessage } from "@line/bot-sdk";
import { lineClientConfig } from "../config/line";
import { logger } from "../utils/logger";

// LINE APIクライアント初期化
export const lineClient = new Client(lineClientConfig);

/**
 * テキストメッセージを送信する
 * @param userId LINEユーザーID
 * @param text 送信するテキスト
 */
export const sendTextMessage = async (
	userId: string,
	text: string,
): Promise<void> => {
	try {
		const message: TextMessage = {
			type: "text",
			text: text,
		};

		await lineClient.pushMessage(userId, message);
		logger.info(`テキストメッセージ送信成功: ${userId}`);
	} catch (error: any) {
		logger.error(`テキストメッセージ送信エラー: ${error.message}`);
		throw error;
	}
};

/**
 * 複数のメッセージを送信する
 * @param userId LINEユーザーID
 * @param messages 送信するメッセージの配列
 */
export const sendMessages = async (
	userId: string,
	messages: Message[],
): Promise<void> => {
	try {
		await lineClient.pushMessage(userId, messages);
		logger.info(`複数メッセージ送信成功: ${userId}`);
	} catch (error: any) {
		logger.error(`複数メッセージ送信エラー: ${error.message}`);
		throw error;
	}
};

/**
 * Flexメッセージを送信する
 * @param userId LINEユーザーID
 * @param altText 代替テキスト
 * @param contents Flexメッセージコンテンツ
 */
export const sendFlexMessage = async (
	userId: string,
	altText: string,
	contents: any,
): Promise<void> => {
	try {
		const message = {
			type: "flex",
			altText: altText,
			contents: contents,
		};

		await lineClient.pushMessage(userId, message as any);
		logger.info(`Flexメッセージ送信成功: ${userId}`);
	} catch (error: any) {
		logger.error(`Flexメッセージ送信エラー: ${error.message}`);
		throw error;
	}
};

/**
 * ユーザープロフィールを取得する
 * @param userId LINEユーザーID
 */
export const getUserProfile = async (userId: string) => {
	try {
		const profile = await lineClient.getProfile(userId);
		logger.info(`ユーザープロフィール取得成功: ${userId}`);
		return profile;
	} catch (error: any) {
		logger.error(`ユーザープロフィール取得エラー: ${error.message}`);
		throw error;
	}
};
