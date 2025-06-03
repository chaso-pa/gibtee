import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';

// テンプレートパス（ESM環境では __dirname が使えないため、ファイルの絶対パスを取得）
const currentDir = process.cwd();
const templatesDir = path.join(currentDir, 'assets', 'tshirt-templates');

/**
 * Tシャツプレビューを生成する
 * @param designImageBuffer デザイン画像のバッファ
 * @param color Tシャツの色
 * @param size Tシャツのサイズ
 * @returns 合成された画像バッファ
 */
export const generateTshirtPreview = async (
  designImageBuffer: Buffer,
  color: string = 'white',
  size: string = 'M'
): Promise<Buffer> => {
  try {
    logger.info(`Tシャツプレビュー生成開始: 色=${color}, サイズ=${size}`);

    // テンプレート画像のパス
    const templatePath = path.join(templatesDir, `${color}.png`);

    // テンプレート画像の存在確認
    try {
      await fs.access(templatePath);
    } catch (error) {
      // テンプレートが存在しない場合は白を使用
      logger.warn(`テンプレート ${color}.png が見つかりません。白を使用します。`);
      color = 'white';
    }

    // テンプレートファイルのパス（再設定）
    const finalTemplatePath = path.join(templatesDir, `${color}.png`);

    // テンプレート画像のメタデータを取得
    const templateMetadata = await sharp(finalTemplatePath).metadata();
    const templateWidth = templateMetadata.width || 800;
    const templateHeight = templateMetadata.height || 1000;

    // デザイン画像をリサイズ（サイズに応じて調整）
    let designWidth;

    // サイズに応じてデザインサイズを調整
    switch (size) {
      case 'S':
        designWidth = Math.floor(templateWidth * 0.35);
        break;
      case 'M':
        designWidth = Math.floor(templateWidth * 0.35);
        break;
      case 'L':
        designWidth = Math.floor(templateWidth * 0.45);
        break;
      case 'XL':
        designWidth = Math.floor(templateWidth * 0.5);
        break;
      default:
        designWidth = Math.floor(templateWidth * 0.35); // デフォルトはM
    }

    // デザイン画像をリサイズ
    const designResized = await sharp(designImageBuffer)
      .resize({
        width: designWidth,
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    // リサイズ後のデザイン画像のメタデータを取得
    const resizedDesignMetadata = await sharp(designResized).metadata();
    designWidth = resizedDesignMetadata.width || designWidth;

    // デザインの配置位置を計算（中央に配置）
    const left = Math.floor((templateWidth - designWidth) / 2);
    const top = Math.floor(templateHeight * 0.25); // 上部から約25%の位置

    // 画像を合成
    const compositeImage = await sharp(finalTemplatePath)
      .composite([
        {
          input: designResized,
          top,
          left
        }
      ])
      .toBuffer();

    logger.info(`Tシャツプレビュー生成完了: 色=${color}, サイズ=${size}`);
    return compositeImage;
  } catch (error: any) {
    logger.error(`Tシャツプレビュー生成エラー: ${error.message}`);
    throw new Error(`Tシャツプレビュー生成に失敗しました: ${error.message}`);
  }
};

/**
 * サイズの表記を標準化する
 * @param sizeText サイズテキスト
 * @returns 標準化されたサイズ
 */
export const normalizeSize = (sizeText: string): string => {
  const upperSize = sizeText.toUpperCase();

  if (upperSize.includes('S') && !upperSize.includes('X')) return 'S';
  if (upperSize.includes('M')) return 'M';
  if (upperSize.includes('L') && !upperSize.includes('X')) return 'L';
  if (upperSize.includes('XL')) return 'XL';

  // デフォルトはMサイズ
  return 'M';
};

/**
 * カラーコードを標準化する
 * @param colorText カラーテキスト
 * @returns 標準化されたカラーコード
 */
export const normalizeColor = (colorText: string): string => {
  const lowerColor = colorText.toLowerCase();

  if (lowerColor.includes('white') || lowerColor.includes('ホワイト')) return 'white';
  if (lowerColor.includes('black') || lowerColor.includes('ブラック')) return 'black';
  if (lowerColor.includes('navy') || lowerColor.includes('ネイビー')) return 'navy';
  if (lowerColor.includes('red') || lowerColor.includes('レッド')) return 'red';

  // デフォルトは白
  return 'white';
};
