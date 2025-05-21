// scripts/setup-rich-menu.ts
import path from "path";
import dotenv from "dotenv";
import { setupRichMenu } from "../src/services/line-rich-menu";
import { logger } from "../src/utils/logger";

// .envファイルを読み込む
dotenv.config();

/**
 * リッチメニューをセットアップするメイン関数
 */
const main = async () => {
  try {
    // リッチメニュー画像のパス
    const imagePath = path.join(__dirname, "../assets/rich-menu.png");
    
    // リッチメニューをセットアップ
    const richMenuId = await setupRichMenu(imagePath);
    
    logger.info(`リッチメニューのセットアップが完了しました。Rich Menu ID: ${richMenuId}`);
    process.exit(0);
  } catch (error: any) {
    logger.error(`リッチメニューのセットアップに失敗しました: ${error.message}`);
    process.exit(1);
  }
};

// スクリプトを実行
main();
