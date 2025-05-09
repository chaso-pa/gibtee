import { sendTextMessage } from "./line.js";
import { logger } from "../utils/logger.js";

/**
 * ヘルプコマンドを処理する
 */
export const handleHelpCommand = async (userId: string): Promise<void> => {
	logger.info(`ヘルプコマンド処理: ${userId}`);

	const helpMessage =
		"gibteeの使い方:\n\n" +
		"1. ジブリ風に変換したい写真を送ってください\n" +
		"2. AIが写真をジブリ風に変換します\n" +
		"3. 変換された画像をTシャツにプレビューします\n" +
		"4. サイズと数量を選んで注文できます\n" +
		"5. 住所と決済情報を入力して注文完了！\n\n" +
		"◆ コマンド一覧 ◆\n" +
		"「ヘルプ」または「使い方」: このメッセージを表示\n" +
		"「質問」または「FAQ」: よくある質問と回答\n" +
		"「状況」または「注文状況」: 注文の状況を確認\n\n" +
		"何か質問がありましたら、お気軽にお問い合わせください！";

	await sendTextMessage(userId, helpMessage);
};

/**
 * FAQコマンドを処理する
 */
export const handleFaqCommand = async (userId: string): Promise<void> => {
	logger.info(`FAQコマンド処理: ${userId}`);

	const faqMessage =
		"よくある質問:\n\n" +
		"Q: 料金はいくらですか？\n" +
		"A: Tシャツ1枚3,980円(税込)です。送料は全国一律500円です。\n\n" +
		"Q: どのような支払い方法がありますか？\n" +
		"A: クレジットカード、LINE Pay、コンビニ決済に対応しています。\n\n" +
		"Q: 納期はどれくらいですか？\n" +
		"A: ご注文から約2週間でお届けします。\n\n" +
		"Q: どんな写真でも変換できますか？\n" +
		"A: 基本的には人物や風景の写真が最適です。文字だけの画像や著作権のある画像はご遠慮ください。\n\n" +
		"Q: 返品・交換はできますか？\n" +
		"A: 商品の不良があった場合のみ、お届けから7日以内に対応いたします。";

	await sendTextMessage(userId, faqMessage);
};

/**
 * 注文状況確認コマンドを処理する
 */
export const handleOrderStatusCommand = async (
	userId: string,
): Promise<void> => {
	logger.info(`注文状況コマンド処理: ${userId}`);

	// MCPフェーズではダミー実装
	const statusMessage =
		"現在の注文状況:\n\n" +
		"注文はありません。\n\n" +
		"MCPフェーズのため、この機能はまだ実装されていません。";

	await sendTextMessage(userId, statusMessage);
};
