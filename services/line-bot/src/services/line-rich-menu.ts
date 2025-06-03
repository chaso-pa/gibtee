import { lineClient } from '../config/line.js';
import fs from 'fs';
import { logger } from '../utils/logger.js';

// リッチメニューのサイズ設定
const RICH_MENU_SIZE = {
  width: 2500, // LINEの推奨サイズ
  height: 843 // LINEの推奨サイズ
};

// リッチメニューの領域設定
const AREAS = [
  {
    bounds: { x: 0, y: 0, width: 833, height: 843 },
    action: { type: 'message', text: '新しい画像' }
  },
  {
    bounds: { x: 833, y: 0, width: 834, height: 843 },
    action: { type: 'message', text: '過去の注文を確認' }
  },
  {
    bounds: { x: 1667, y: 0, width: 833, height: 843 },
    action: { type: 'message', text: 'Q&A' }
  }
];

/**
 * リッチメニューを作成する関数
 */
export const createRichMenu = async (): Promise<string> => {
  try {
    // リッチメニューを作成
    const richMenuId = await lineClient.createRichMenu({
      size: RICH_MENU_SIZE,
      selected: true,
      name: 'Gibtee メインメニュー',
      chatBarText: 'メニュー',
      // @ts-ignore
      areas: AREAS
    });

    logger.info(`リッチメニューを作成しました: ${richMenuId}`);
    return richMenuId;
  } catch (error: any) {
    logger.error(`リッチメニュー作成エラー: ${error.message}`);
    throw error;
  }
};

/**
 * リッチメニュー画像をアップロードする関数
 */
export const uploadRichMenuImage = async (richMenuId: string, imagePath: string): Promise<void> => {
  try {
    const buffer = fs.readFileSync(imagePath);
    await lineClient.setRichMenuImage(richMenuId, buffer);
    logger.info(`リッチメニュー画像をアップロードしました: ${richMenuId}`);
  } catch (error: any) {
    logger.error(`リッチメニュー画像アップロードエラー: ${error.message}`);
    throw error;
  }
};

/**
 * リッチメニューをデフォルトに設定する関数
 */
export const setDefaultRichMenu = async (richMenuId: string): Promise<void> => {
  try {
    await lineClient.setDefaultRichMenu(richMenuId);
    logger.info(`リッチメニューをデフォルトに設定しました: ${richMenuId}`);
  } catch (error: any) {
    logger.error(`デフォルトリッチメニュー設定エラー: ${error.message}`);
    throw error;
  }
};

/**
 * 既存のリッチメニューをすべて削除する関数
 */
export const deleteAllRichMenus = async (): Promise<void> => {
  try {
    const richMenuList = await lineClient.getRichMenuList();
    const deletePromises = richMenuList.map((menu) => lineClient.deleteRichMenu(menu.richMenuId));
    await Promise.all(deletePromises);
    logger.info(`既存のリッチメニューをすべて削除しました`);
  } catch (error: any) {
    logger.error(`リッチメニュー削除エラー: ${error.message}`);
    throw error;
  }
};

/**
 * リッチメニューのセットアップを行う関数
 * - 既存のリッチメニューを削除
 * - 新しいリッチメニューを作成
 * - 画像をアップロード
 * - デフォルトに設定
 */
export const setupRichMenu = async (imagePath: string): Promise<string> => {
  try {
    // 既存のリッチメニューを削除
    await deleteAllRichMenus();

    // 新しいリッチメニューを作成
    const richMenuId = await createRichMenu();

    // 画像をアップロード
    await uploadRichMenuImage(richMenuId, imagePath);

    // デフォルトに設定
    await setDefaultRichMenu(richMenuId);

    logger.info(`リッチメニューのセットアップが完了しました: ${richMenuId}`);
    return richMenuId;
  } catch (error: any) {
    logger.error(`リッチメニューセットアップエラー: ${error.message}`);
    throw error;
  }
};
