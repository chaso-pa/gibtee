import { FollowEvent, UnfollowEvent } from "@line/bot-sdk";
import { getUserProfile, sendTextMessage } from "../services/line.js";
import { saveUserToDB, deactivateUser } from "../services/user.js";
import {
	updateUserConversationState,
	ConversationState,
} from "../services/conversation.js";
import { logger } from "../utils/logger.js";

/**
 * フォローイベント（友だち追加）を処理する
 */
export const handleFollow = async (event: FollowEvent): Promise<void> => {
	const userId = event.source.userId as string;
	logger.info(`フォローイベント受信: ${userId}`);

	try {
		// ユーザープロフィール取得
		const profile = await getUserProfile(userId);

		// ユーザー情報をDBに保存
		await saveUserToDB(userId, profile);

		// 会話状態を初期挨拶に設定
		await updateUserConversationState(
			userId,
			ConversationState.INITIAL_GREETING,
		);

		// ウェルカムメッセージを送信
		await sendTextMessage(
			userId,
			`こんにちは、${profile.displayName}さん！\ngibteeへようこそ。\n\nあなたの写真をジブリ風に変換して、オリジナルTシャツを作ることができます。\n\n写真を送ってみてください！`,
		);
	} catch (error: any) {
		logger.error(`フォロー処理エラー: ${error.message}`);
	}
};

/**
 * アンフォローイベント（ブロック）を処理する
 */
export const handleUnfollow = async (event: UnfollowEvent): Promise<void> => {
	const userId = event.source.userId as string;
	logger.info(`アンフォローイベント受信: ${userId}`);

	try {
		// ユーザーを非アクティブに設定
		await deactivateUser(userId);
	} catch (error: any) {
		logger.error(`アンフォロー処理エラー: ${error.message}`);
	}
};
