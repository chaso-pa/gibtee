import sharp from 'sharp';
import { logger } from './logger.js';

/**
 * 画像をリサイズする
 * @param imageBuffer 画像バッファ
 * @param maxWidth 最大幅
 * @param maxHeight 最大高さ
 * @returns リサイズされた画像バッファ
 */
export const resizeImage = async (
  imageBuffer: Buffer,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<Buffer> => {
  try {
    // 画像メタデータを取得
    const metadata = await sharp(imageBuffer).metadata();

    // 現在の幅と高さ
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // リサイズが必要ない場合は元の画像を返す
    if (width <= maxWidth && height <= maxHeight) {
      return imageBuffer;
    }

    // アスペクト比を保持してリサイズ
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    logger.info(`画像をリサイズしました: ${width}x${height} → ${maxWidth}x${maxHeight}`);
    return resizedImageBuffer;
  } catch (error: any) {
    logger.error(`画像リサイズエラー: ${error.message}`);
    throw new Error(`画像リサイズに失敗しました: ${error.message}`);
  }
};

/**
 * 画像をBase64エンコードする
 * @param imageBuffer 画像バッファ
 * @returns Base64エンコードされた文字列
 */
export const imageToBase64 = (imageBuffer: Buffer): string => {
  return imageBuffer.toString('base64');
};

/**
 * Base64エンコードされた画像をバッファに変換する
 * @param base64 Base64エンコードされた文字列
 * @returns 画像バッファ
 */
export const base64ToBuffer = (base64: string): Buffer => {
  return Buffer.from(base64, 'base64');
};

/**
 * 画像形式を変換する
 * @param imageBuffer 画像バッファ
 * @param format 変換先フォーマット（'jpeg', 'png', 'webp'など）
 * @param options フォーマット固有のオプション
 * @returns 変換された画像バッファ
 */
export const convertImageFormat = async (
  imageBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg',
  options: any = {}
): Promise<Buffer> => {
  try {
    let converter = sharp(imageBuffer);

    switch (format) {
      case 'jpeg':
        converter = converter.jpeg(options);
        break;
      case 'png':
        converter = converter.png(options);
        break;
      case 'webp':
        converter = converter.webp(options);
        break;
    }

    const outputBuffer = await converter.toBuffer();
    logger.info(`画像形式を${format}に変換しました`);
    return outputBuffer;
  } catch (error: any) {
    logger.error(`画像形式変換エラー: ${error.message}`);
    throw new Error(`画像形式変換に失敗しました: ${error.message}`);
  }
};
