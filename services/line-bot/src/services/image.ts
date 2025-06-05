import type { ImageEventMessage } from '@line/bot-sdk';
import { lineClient } from '../config/line.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { uploadBufferToS3, getS3SignedUrl } from '../utils/s3.js';
import { updateUserConversationState, ConversationState } from './conversation.js';
import { convertToGhibliStyle } from './image-processor.js';
import { createImageConversionResultFlex } from './flex-message.js';

/**
 * LINE画像メッセージを処理する
 */
export const handleImageMessage = async (
  userId: string,
  message: ImageEventMessage,
  replyToken: string,
  _currentState: ConversationState,
  _context: any
): Promise<void> => {
  try {
    logger.info(`画像メッセージ受信: ${message.id} (${userId})`);

    // 1. LINEプラットフォームから画像コンテンツを取得
    const stream = await lineClient.getMessageContent(message.id);

    // 2. バイナリデータを取得
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const imageBuffer = Buffer.concat(chunks);

    // 3. ユーザーに処理中メッセージを送信
    await lineClient.replyMessage(replyToken, {
      type: 'text',
      text: '画像を受け取りました！ジブリ風に変換中です...'
    });

    // 4. ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 5. S3バケットに画像をアップロード
    const timestamp = Date.now();
    const originalImageKey = await uploadBufferToS3(
      imageBuffer,
      `${timestamp}_original.jpg`,
      `users/${userId}/images/`
    );

    // 6. 署名付きURLを生成（24時間有効）
    const originalImageUrl = await getS3SignedUrl(originalImageKey, 24 * 60 * 60);

    // 7. 画像レコードをデータベースに保存
    const image = await prisma.image.create({
      data: {
        userId: user.id,
        originalImagePath: originalImageKey,
        status: 'processing'
      }
    });

    logger.info(`画像レコード作成: ${image.id}, パス: ${originalImageKey}`);

    // 8. 会話状態を更新
    await updateUserConversationState(userId, ConversationState.IMAGE_PROCESSING, {
      imageId: image.id,
      originalImageKey
    });

    try {
      // 9. 画像処理サービスで画像を変換
      const { convertedImageKey, signedUrl: ghibliImageUrl } = await convertToGhibliStyle(originalImageKey, userId);

      // 10. 変換完了したら画像レコードを更新
      await prisma.image.update({
        where: { id: image.id },
        data: {
          ghibliImagePath: convertedImageKey,
          status: 'completed'
        }
      });

      // 11. まず変換画像を画像メッセージとして送信
      await lineClient.pushMessage(userId, {
        type: 'image',
        originalContentUrl: ghibliImageUrl,
        previewImageUrl: ghibliImageUrl
      });

      // 12. 変換完了テキストを送信
      await lineClient.pushMessage(userId, {
        type: 'text',
        text: '変換完了！ジブリ風画像が作成されました！'
      });

      // 13. 少し間を空けてから詳細な変換結果をFlexメッセージで送信
      setTimeout(async () => {
        const conversionResultFlex = createImageConversionResultFlex(originalImageUrl, ghibliImageUrl);

        await lineClient.pushMessage(userId, conversionResultFlex);

        // 会話状態をプレビュー状態に更新
        await updateUserConversationState(userId, ConversationState.TSHIRT_PREVIEW, {
          imageId: image.id,
          originalImageKey,
          ghibliImageKey: convertedImageKey
        });
      }, 1000); // 1秒後に送信
    } catch (conversionError: any) {
      logger.error(`画像変換エラー: ${conversionError.message}`);

      // 変換失敗時の処理
      await prisma.image.update({
        where: { id: image.id },
        data: {
          status: 'failed'
        }
      });

      await lineClient.pushMessage(userId, {
        type: 'text',
        text: '申し訳ありません。画像の変換中にエラーが発生しました。別の画像で試してみてください。'
      });

      // 会話状態をリセット
      await updateUserConversationState(userId, ConversationState.WAITING);
    }
  } catch (error: any) {
    logger.error(`画像処理エラー: ${error.message}`);

    // エラー時の応答
    await lineClient.pushMessage(userId, {
      type: 'text',
      text: '申し訳ありません。画像の処理中にエラーが発生しました。しばらく経ってからもう一度お試しください。'
    });

    // 会話状態をリセット
    await updateUserConversationState(userId, ConversationState.WAITING);
  }
};
