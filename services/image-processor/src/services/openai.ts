import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// OpenAIクライアント初期化
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  organization: config.openai.orgId
});

/**
 * ジブリ風のプロンプトテンプレート
 */
const GHIBLI_STYLE_PROMPT =
  'Transform this image into a whimsical and nature-inspired ghibli animation style. ' +
  'Use soft, warm tones, intricate linework, and rich natural elements to evoke a sense of wonder and tranquility. ' +
  'Maintain the essence of the original image while applying the distinctive Ghibli aesthetic ' +
  "similar to movies like 'My Neighbor Totoro', 'Spirited Away', and 'Howl's Moving Castle'. " +
  'Retain the original composition and key elements, but reimagine it in a unique artistic style.';

/**
 * 画像をジブリ風に変換する
 * @param imageBuffer 元の画像バッファ
 * @returns 変換後の画像バッファ
 */
export const convertToGhibliStyle = async (imageBuffer: Buffer): Promise<Buffer> => {
  try {
    logger.info('ジブリスタイル変換開始');

    // APIリクエストの開始時間を記録
    const startTime = Date.now();

    // 画像をPNG形式に変換
    const pngBuffer = await sharp(imageBuffer).png().toBuffer();

    // 一時ファイルパスを作成
    const tempDir = os.tmpdir();
    const imageFilePath = path.join(tempDir, `${uuidv4()}.png`);

    // 画像を一時ファイルに保存
    await fs.writeFile(imageFilePath, pngBuffer);

    try {
      // OpenAI Images API を使用して画像を変換
      const image = await toFile(fs.readFile(imageFilePath), null, {
        type: 'image/png'
      });

      const response = await openai.images.edit({
        model: config.openai.model, // 指定されたモデル
        image: [image],
        prompt: GHIBLI_STYLE_PROMPT,
        n: 1,
        size: '1024x1024'
      });

      // レスポンスから画像URLを取得
      if (!response?.data || !response.data[0]) {
        throw new Error('画像が返されませんでした');
      }
      console.log(response.data[0]);

      const imageBase64 = response.data[0].b64_json;
      // @ts-ignore
      const imageBytes = Buffer.from(imageBase64, 'base64');

      // 処理時間をログ
      const elapsedTime = Date.now() - startTime;
      logger.info(`OpenAI API処理時間: ${elapsedTime}ms`);

      // 一時ファイルを削除
      await fs.unlink(imageFilePath).catch((err) => logger.warn(`一時ファイル削除エラー: ${err.message}`));

      logger.info('ジブリスタイル変換完了');

      return imageBytes;
    } finally {
      // エラーが発生しても一時ファイルを削除
      fs.unlink(imageFilePath).catch(() => {});
    }
  } catch (error: any) {
    logger.error(`OpenAI API エラー: ${error.message}`);
    throw new Error(`画像変換処理に失敗しました: ${error.message}`);
  }
};

/**
 * API通信のリトライ処理を行う汎用関数
 * @param operation 実行する非同期操作
 * @param retries 最大リトライ回数
 * @param delay 初期遅延時間（ミリ秒）
 * @returns 操作の結果
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries: number = config.openai.maxRetries,
  delay: number = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // リトライ可能なエラーかどうかをチェック
    if (
      retries <= 0 ||
      error.status === 400 || // Bad request
      error.status === 401 || // Unauthorized
      error.status === 403 // Forbidden
    ) {
      throw error;
    }

    // 指数バックオフでリトライ
    const backoffDelay = delay * (Math.random() + 0.5);
    logger.warn(`操作に失敗しました。${backoffDelay}ms後にリトライします。残りリトライ回数: ${retries}`);

    await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    return withRetry(operation, retries - 1, delay * 2);
  }
};
