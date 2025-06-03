import { MessageEvent, TextEventMessage, ImageEventMessage } from '@line/bot-sdk';
import { logger } from '../utils/logger.js';
import { sendTextMessage } from '../services/line.js';
import {
  getUserConversationState,
  updateUserConversationState,
  saveUserConversation,
  ConversationState
} from '../services/conversation.js';
import { handleImageMessage } from '../services/image.js';
import { handleHelpCommand, handleFaqCommand, handleOrderHistoryRequest } from '../services/commands.js';
import { lineClient } from '../config/line.js';
import { generateTshirtPreview } from '@/services/image-processor.js';
import { createOrder } from '../services/order.js';
import {
  createQuantitySelectionFlex,
  createAddressInputGuideFlex,
  createOrderConfirmationFlex,
  createPaymentMethodSelectionFlex,
  createTshirtPreviewFlex,
  createColorSelectionFlex,
  createCreditCardPaymentFlex
} from '../services/flex-message.js';
import { processPayment, PaymentMethod } from '../services/payment.js';

import { getS3SignedUrl } from '@/utils/s3.js';

export const handleMessage = async (event: MessageEvent): Promise<void> => {
  const { replyToken, source, message } = event;
  const userId = source.userId as string;

  try {
    // 会話状態を取得
    const { state, context } = await getUserConversationState(userId);
    logger.info(`現在の会話状態: ${userId} - ${state}`);

    // メッセージタイプに基づいて処理を分岐
    switch (message.type) {
      case 'text':
        await handleTextMessage(userId, message as TextEventMessage, state, context);
        break;
      case 'image':
        await handleImageMessage(userId, message as ImageEventMessage, replyToken, state, context);
        break;
      default:
        logger.info(`未対応のメッセージタイプ: ${message.type}`);
        await sendTextMessage(
          userId,
          `すみません、${message.type}タイプのメッセージには対応していません。テキストか画像を送ってください。`
        );
        break;
    }

    // 会話履歴の保存
    await saveUserConversation(userId, event);
  } catch (error: any) {
    logger.error(`メッセージ処理エラー: ${error.message}`);
    await sendTextMessage(
      userId,
      'すみません、メッセージの処理中にエラーが発生しました。しばらく経ってからもう一度お試しください。'
    );
  }
};

/**
 * テキストメッセージを処理する
 */
const handleTextMessage = async (
  userId: string,
  message: TextEventMessage,
  currentState: ConversationState,
  context: any
): Promise<void> => {
  const { text } = message;
  logger.info(`テキストメッセージ受信: ${text} (${userId})`);

  // テキストの内容に応じて処理を分岐
  if (text.includes('ヘルプ') || text.includes('使い方')) {
    // ヘルプコマンド処理
    await handleHelpCommand(userId);
    await updateUserConversationState(userId, ConversationState.HELP);
    return;
  }

  if (text.includes('Q&A')) {
    await handleFaqCommand(userId);
    await updateUserConversationState(userId, ConversationState.FAQ);
    return;
  }

  if (text.includes('過去の注文を確認')) {
    await handleOrderHistoryRequest(userId);
    await updateUserConversationState(userId, ConversationState.FAQ);
    return;
  }

  if (text.includes('新しい写真')) {
    await sendTextMessage(userId, '新しい写真を送ってください！');
    await updateUserConversationState(userId, ConversationState.WAITING);
    return;
  }

  // 会話状態に基づいた処理
  switch (currentState) {
    case ConversationState.TSHIRT_PREVIEW:
      // Tシャツプレビュー状態での処理
      if (text === 'Tシャツにする') {
        await handleTshirtCreationRequest(userId, context);
      } else if (text === 'やり直す') {
        await sendTextMessage(userId, '別の写真を送ってください！');
        await updateUserConversationState(userId, ConversationState.WAITING);
      } else if (text === '色を変更する') {
        await handleColorSelectionRequest(userId, context);
      } else {
        await sendTextMessage(userId, 'ボタンから選択してください。または別の写真を送ってみましょう！');
      }
      break;

    case ConversationState.COLOR_SELECTION:
      // 色選択状態での処理
      await handleColorSelection(userId, text, context);
      break;

    case ConversationState.SIZE_SELECTION:
      // サイズ選択の処理
      await handleSizeSelection(userId, text, context);
      break;

    case ConversationState.QUANTITY_SELECTION:
      // 数量選択の処理
      await handleQuantitySelection(userId, text, context);
      break;

    case ConversationState.INITIAL_GREETING:
      // 初回挨拶後は待機状態へ
      await sendTextMessage(userId, 'ジブリ風に変換したい写真を送ってください！');
      await updateUserConversationState(userId, ConversationState.WAITING);
      break;

    case ConversationState.QUANTITY_SELECTION:
      // 数量選択の処理
      await handleQuantitySelection(userId, text, context);
      break;

    case ConversationState.ADDRESS_INPUT:
      // 配送先入力の開始処理
      if (text === '配送先の入力を開始') {
        await startAddressInput(userId, context);
      } else if (text === 'キャンセル') {
        await sendTextMessage(userId, '注文をキャンセルしました。もう一度やり直す場合は、写真を送信してください。');
        await updateUserConversationState(userId, ConversationState.WAITING);
      } else {
        await sendTextMessage(userId, 'ボタンから「入力を開始する」を選択してください。');
      }
      break;

    case ConversationState.ADDRESS_RECIPIENT_NAME:
      // 受取人名の処理
      await handleRecipientName(userId, text, context);
      break;

    case ConversationState.ADDRESS_PHONE:
      // 電話番号の処理
      await handlePhoneNumber(userId, text, context);
      break;

    case ConversationState.ADDRESS_POSTAL_CODE:
      // 郵便番号の処理
      await handlePostalCode(userId, text, context);
      break;

    case ConversationState.ADDRESS_PREFECTURE:
      // 都道府県の処理
      await handlePrefecture(userId, text, context);
      break;

    case ConversationState.ADDRESS_CITY:
      // 市区町村の処理
      await handleCity(userId, text, context);
      break;

    case ConversationState.ADDRESS_STREET:
      // 番地の処理
      await handleStreetAddress(userId, text, context);
      break;

    case ConversationState.ADDRESS_BUILDING:
      // 建物名の処理
      await handleBuildingName(userId, text, context);
      break;

    case ConversationState.ADDRESS_CONFIRMATION:
      // 配送先確認の処理
      await handleAddressConfirmation(userId, text, context);
      break;

    // 新しい決済関連のケースを追加
    case ConversationState.PAYMENT_METHOD_SELECTION:
      // 決済方法選択の処理
      await handlePaymentMethodSelection(userId, text, context);
      break;

    case ConversationState.PAYMENT_COMPLETED:
      // 決済完了後の処理
      if (text === '支払い完了を確認') {
        await sendTextMessage(
          userId,
          'この度はご注文ありがとうございます。製品の発送準備が整い次第、また連絡いたします。'
        );
        await updateUserConversationState(userId, ConversationState.WAITING);
      }
      break;

    default:
      // デフォルトの応答
      if (text.includes('こんにちは')) {
        await sendTextMessage(userId, 'こんにちは！gibteeへようこそ。写真を送ってジブリ風に変換してみましょう！');
      } else {
        await sendTextMessage(userId, 'ジブリ風に変換したい写真を送ってください！');
      }
      // 既に待機中以外の状態の場合は待機中に戻す
      if (currentState !== ConversationState.WAITING) {
        await updateUserConversationState(userId, ConversationState.WAITING);
      }
      break;
  }
};

/**
 * Tシャツ作成リクエストを処理する
 */
const handleTshirtCreationRequest = async (userId: string, context: any): Promise<void> => {
  try {
    logger.info(`Tシャツ作成リクエスト処理: ${userId}`);

    if (!context.ghibliImageKey) {
      throw new Error('画像キーが見つかりません');
    }

    // デフォルトカラーと、サイズ
    const defaultColor = 'white';
    const defaultSize = 'M';

    // Tシャツプレビューを生成
    const { signedUrl: previewImageUrl } = await generateTshirtPreview(
      context.ghibliImageKey,
      defaultColor,
      defaultSize,
      userId
    );

    // Tシャツプレビューを送信
    const tshirtPreviewFlex = createTshirtPreviewFlex(previewImageUrl, defaultColor);
    await lineClient.pushMessage(userId, tshirtPreviewFlex);

    // コンテキストに選択された色を追加
    context.selectedColor = defaultColor;
    context.selectedSize = defaultSize;
    await updateUserConversationState(userId, ConversationState.SIZE_SELECTION, context);
  } catch (error: any) {
    logger.error(`Tシャツ作成リクエスト処理エラー: ${error.message}`);
    await sendTextMessage(
      userId,
      '申し訳ありません。Tシャツプレビューの生成に失敗しました。もう一度試してみてください。'
    );
    await updateUserConversationState(userId, ConversationState.WAITING);
  }
};

/**
 * 色選択リクエストを処理する
 */
const handleColorSelectionRequest = async (userId: string, context: any): Promise<void> => {
  try {
    logger.info(`色選択リクエスト処理: ${userId}`);

    // 色選択Flexメッセージを送信
    const colorSelectionFlex = createColorSelectionFlex();
    await lineClient.pushMessage(userId, colorSelectionFlex);

    // 会話状態を色選択に更新
    await updateUserConversationState(userId, ConversationState.COLOR_SELECTION, context);
  } catch (error: any) {
    logger.error(`色選択リクエスト処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。色選択の表示に失敗しました。もう一度試してみてください。');
  }
};

/**
 * 色選択を処理する
 */
const handleColorSelection = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    logger.info(`色選択処理: ${userId}, 選択: ${text}`);

    // 選択された色を取得
    let selectedColor = 'white';
    if (text.includes('ブラック')) selectedColor = 'black';
    else if (text.includes('ネイビー')) selectedColor = 'navy';
    else if (text.includes('レッド')) selectedColor = 'red';
    else if (text.includes('ホワイト')) selectedColor = 'white';
    else if (text.includes('戻る')) {
      // 「戻る」ボタンが押された場合
      selectedColor = context.selectedColor || 'white';
    } else {
      // 不明な選択の場合
      await sendTextMessage(userId, '有効な色を選択してください。');
      return;
    }

    // 選択されたサイズ（コンテキストから取得、なければデフォルト）
    const selectedSize = context.selectedSize || 'M';

    // Tシャツプレビューを生成
    const { signedUrl: previewImageUrl } = await generateTshirtPreview(
      context.ghibliImageKey,
      selectedColor,
      selectedSize,
      userId
    );

    // 選択された色でTシャツプレビューを更新
    const tshirtPreviewFlex = createTshirtPreviewFlex(previewImageUrl, selectedColor);
    await lineClient.pushMessage(userId, tshirtPreviewFlex);

    // コンテキストに選択された色を保存
    context.selectedColor = selectedColor;
    await updateUserConversationState(userId, ConversationState.SIZE_SELECTION, context);
  } catch (error: any) {
    logger.error(`色選択処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。色の適用に失敗しました。もう一度試してみてください。');
  }
};

/**
 * サイズ選択処理
 */
const handleSizeSelection = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    logger.info(`サイズ選択処理: ${userId}, 選択: ${text}`);

    let selectedSize = '';

    // サイズの選択を判定
    if (text.includes('S')) selectedSize = 'S';
    else if (text.includes('M')) selectedSize = 'M';
    else if (text.includes('L')) selectedSize = 'L';
    else if (text.includes('XL')) selectedSize = 'XL';

    // 「やり直す」または「色を変更する」ボタンの処理
    if (text === 'やり直す') {
      await sendTextMessage(userId, '別の写真を送ってください！');
      await updateUserConversationState(userId, ConversationState.WAITING);
      return;
    } else if (text === '色を変更する') {
      await handleColorSelectionRequest(userId, context);
      return;
    } else if (!selectedSize) {
      // 有効なサイズが選択されていない場合
      await sendTextMessage(userId, '有効なサイズを選択してください。');
      return;
    }

    // コンテキストにサイズを保存
    context.selectedSize = selectedSize;

    // 数量選択FlexメッセージでUI表示
    const quantitySelectionFlex = createQuantitySelectionFlex();
    await lineClient.pushMessage(userId, quantitySelectionFlex);

    // 会話状態を数量選択に更新
    await updateUserConversationState(userId, ConversationState.QUANTITY_SELECTION, context);
  } catch (error: any) {
    logger.error(`サイズ選択処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。サイズの選択に失敗しました。もう一度試してみてください。');
  }
};

/**
 * 数量選択処理
 */
// 数量選択処理関数の更新
const handleQuantitySelection = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    logger.info(`数量選択処理: ${userId}, 選択: ${text}`);

    // テキストから数量を抽出（数字のみ抽出）
    const quantityMatch = text.match(/\d+/);
    if (!quantityMatch) {
      // 「サイズ選択に戻る」の処理
      if (text === 'サイズ選択に戻る') {
        // 再度サイズ選択画面を表示
        const previewImageUrl = await getS3SignedUrl(context.ghibliImageKey, 24 * 60 * 60);
        const tshirtPreviewFlex = createTshirtPreviewFlex(previewImageUrl, context.selectedColor || 'white');
        await lineClient.pushMessage(userId, tshirtPreviewFlex);
        await updateUserConversationState(userId, ConversationState.SIZE_SELECTION, context);
        return;
      }

      await sendTextMessage(userId, '有効な数量を入力してください（1〜5）。');
      return;
    }

    const quantity = parseInt(quantityMatch[0], 10);

    // 数量の検証
    if (isNaN(quantity) || quantity < 1 || quantity > 5) {
      await sendTextMessage(userId, '数量は1〜5の間で指定してください。');
      return;
    }

    // 価格計算
    let unitPrice = 3980;
    let totalPrice = 0;

    if (quantity === 1) {
      totalPrice = unitPrice;
    } else if (quantity === 2) {
      totalPrice = 7500;
      unitPrice = 3750;
    } else {
      unitPrice = 3500;
      totalPrice = unitPrice * quantity;
    }

    // コンテキストに数量と価格を保存
    context.quantity = quantity;
    context.unitPrice = unitPrice;
    context.totalPrice = totalPrice;

    // 注文内容の確認メッセージ
    await sendTextMessage(
      userId,
      `数量: ${quantity}枚\n` +
        `単価: ${unitPrice.toLocaleString()}円\n` +
        `合計: ${totalPrice.toLocaleString()}円（税込）\n\n` +
        `次に配送先情報を入力していただきます。`
    );

    // 配送先入力案内を表示
    setTimeout(async () => {
      const addressInputFlex = createAddressInputGuideFlex();
      await lineClient.pushMessage(userId, addressInputFlex);
      await updateUserConversationState(userId, ConversationState.ADDRESS_INPUT, context);
    }, 1000);
  } catch (error: any) {
    logger.error(`数量選択処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。数量の選択に失敗しました。もう一度試してみてください。');
  }
};

const startAddressInput = async (userId: string, context: any): Promise<void> => {
  try {
    // 受取人名の入力を促す
    await sendTextMessage(userId, 'お名前（受取人）を入力してください。');

    // 会話状態を受取人名入力に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_RECIPIENT_NAME, context);
  } catch (error: any) {
    logger.error(`配送先入力開始エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。配送先の入力を開始できませんでした。もう一度試してみてください。');
  }
};

/**
 * 受取人名の処理
 */
const handleRecipientName = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    // 入力が空でないか確認
    if (!text || text.trim() === '') {
      await sendTextMessage(userId, 'お名前を入力してください。');
      return;
    }

    // コンテキストに受取人名を保存
    context.recipientName = text.trim();

    // 電話番号の入力を促す
    await sendTextMessage(userId, '電話番号を入力してください（ハイフンなしでも可）。');

    // 会話状態を電話番号入力に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_PHONE, context);
  } catch (error: any) {
    logger.error(`受取人名処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。お名前の処理に失敗しました。もう一度入力してください。');
  }
};

/**
 * 電話番号の処理
 */
const handlePhoneNumber = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    // 入力が電話番号形式か確認
    const phoneNumberPattern = /^0\d{1,4}-?\d{1,4}-?\d{3,4}$/;
    if (!phoneNumberPattern.test(text.trim())) {
      await sendTextMessage(userId, '有効な電話番号を入力してください（例: 090-1234-5678 または 09012345678）。');
      return;
    }

    // ハイフンを削除して標準化
    const normalizedPhone = text.trim().replace(/-/g, '');

    // コンテキストに電話番号を保存
    context.recipientPhone = normalizedPhone;

    // 郵便番号の入力を促す
    await sendTextMessage(userId, '郵便番号を入力してください（例: 123-4567 または 1234567）。');

    // 会話状態を郵便番号入力に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_POSTAL_CODE, context);
  } catch (error: any) {
    logger.error(`電話番号処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。電話番号の処理に失敗しました。もう一度入力してください。');
  }
};

/**
 * 郵便番号の処理
 */
const handlePostalCode = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    // 入力が郵便番号形式か確認
    const postalCodePattern = /^\d{3}-?\d{4}$/;
    if (!postalCodePattern.test(text.trim())) {
      await sendTextMessage(userId, '有効な郵便番号を入力してください（例: 123-4567 または 1234567）。');
      return;
    }

    // ハイフンを削除して標準化
    const normalizedPostalCode = text.trim().replace(/-/g, '');

    // コンテキストに郵便番号を保存
    context.postalCode = normalizedPostalCode;

    // 都道府県の入力を促す
    await sendTextMessage(userId, '都道府県を入力してください。');

    // 会話状態を都道府県入力に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_PREFECTURE, context);
  } catch (error: any) {
    logger.error(`郵便番号処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。郵便番号の処理に失敗しました。もう一度入力してください。');
  }
};

/**
 * 都道府県の処理
 */
const handlePrefecture = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    // 入力が空でないか確認
    if (!text || text.trim() === '') {
      await sendTextMessage(userId, '都道府県を入力してください。');
      return;
    }

    // コンテキストに都道府県を保存
    context.prefecture = text.trim();

    // 市区町村の入力を促す
    await sendTextMessage(userId, '市区町村を入力してください。');

    // 会話状態を市区町村入力に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_CITY, context);
  } catch (error: any) {
    logger.error(`都道府県処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。都道府県の処理に失敗しました。もう一度入力してください。');
  }
};

/**
 * 市区町村の処理
 */
const handleCity = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    // 入力が空でないか確認
    if (!text || text.trim() === '') {
      await sendTextMessage(userId, '市区町村を入力してください。');
      return;
    }

    // コンテキストに市区町村を保存
    context.city = text.trim();

    // 番地の入力を促す
    await sendTextMessage(userId, '番地を入力してください。');

    // 会話状態を番地入力に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_STREET, context);
  } catch (error: any) {
    logger.error(`市区町村処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。市区町村の処理に失敗しました。もう一度入力してください。');
  }
};

/**
 * 番地の処理
 */
const handleStreetAddress = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    // 入力が空でないか確認
    if (!text || text.trim() === '') {
      await sendTextMessage(userId, '番地を入力してください。');
      return;
    }

    // コンテキストに番地を保存
    context.streetAddress = text.trim();

    // 建物名の入力を促す
    await sendTextMessage(userId, '建物名・部屋番号を入力してください（なければ「なし」と入力）。');

    // 会話状態を建物名入力に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_BUILDING, context);
  } catch (error: any) {
    logger.error(`番地処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。番地の処理に失敗しました。もう一度入力してください。');
  }
};

/**
 * 建物名の処理
 */
const handleBuildingName = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    // 建物名をコンテキストに保存（「なし」の場合は空文字列）
    if (text.trim() === 'なし') {
      context.buildingName = '';
    } else {
      context.buildingName = text.trim();
    }

    // 注文内容の確認
    const orderData = {
      color: context.selectedColor || 'white',
      size: context.selectedSize || 'M',
      quantity: context.quantity || 1,
      unitPrice: context.unitPrice || 3980,
      totalPrice: context.totalPrice || 3980,
      recipientName: context.recipientName,
      postalCode: context.postalCode,
      prefecture: context.prefecture,
      city: context.city,
      streetAddress: context.streetAddress,
      buildingName: context.buildingName
    };

    // 注文確認メッセージを表示
    const orderConfirmationFlex = createOrderConfirmationFlex(orderData);
    await lineClient.pushMessage(userId, orderConfirmationFlex);

    // 会話状態を配送先確認に更新
    await updateUserConversationState(userId, ConversationState.ADDRESS_CONFIRMATION, context);
  } catch (error: any) {
    logger.error(`建物名処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。建物名の処理に失敗しました。もう一度入力してください。');
  }
};

/**
 * 配送先確認の処理
 */
const handleAddressConfirmation = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    if (text === '注文を確定する') {
      // 注文レコード作成
      const orderResult = await createOrder(userId, context.imageId, {
        size: context.selectedSize || 'M',
        color: context.selectedColor || 'white',
        quantity: context.quantity || 1,
        unitPrice: context.unitPrice || 3980,
        totalPrice: context.totalPrice || 3980,
        recipientName: context.recipientName,
        recipientPhone: context.recipientPhone,
        postalCode: context.postalCode,
        prefecture: context.prefecture,
        city: context.city,
        streetAddress: context.streetAddress,
        buildingName: context.buildingName
      });

      // コンテキストに注文情報を保存
      context.orderId = orderResult.orderId;
      context.orderNumber = orderResult.orderNumber;

      // 決済方法選択画面を表示
      const paymentMethodFlex = createPaymentMethodSelectionFlex(orderResult.orderNumber, context.totalPrice || 3980);
      await lineClient.pushMessage(userId, paymentMethodFlex);

      // 会話状態を決済方法選択に更新
      await updateUserConversationState(userId, ConversationState.PAYMENT_METHOD_SELECTION, context);
    } else if (text === 'キャンセル') {
      await sendTextMessage(userId, '注文をキャンセルしました。もう一度やり直す場合は、写真を送信してください。');
      await updateUserConversationState(userId, ConversationState.WAITING);
    } else {
      await sendTextMessage(userId, 'ボタンから「注文を確定する」または「キャンセル」を選択してください。');
    }
  } catch (error: any) {
    logger.error(`配送先確認処理エラー: ${error.message}`);
    await sendTextMessage(userId, '申し訳ありません。注文の確定に失敗しました。もう一度試してみてください。');
  }
};

/**
 * 決済方法選択の処理
 */
const handlePaymentMethodSelection = async (userId: string, text: string, context: any): Promise<void> => {
  try {
    if (text === 'LINE Payで支払う') {
      await sendTextMessage(userId, 'LINE Payでの決済を開始します。決済画面に遷移します。');

      // LINE Pay決済処理
      const paymentResult = await processPayment(
        PaymentMethod.LINE_PAY,
        context.orderId,
        context.orderNumber,
        context.totalPrice || 3980,
        {}
      );

      if (paymentResult.success && paymentResult.paymentUrl) {
        // LINE Payの決済URLを送信
        await lineClient.pushMessage(userId, {
          type: 'text',
          text: `下記のURLから決済を完了してください。\n${paymentResult.paymentUrl}`
        });

        // 決済中状態に更新
        await updateUserConversationState(userId, ConversationState.PAYMENT_PROCESSING, context);
      } else {
        await sendTextMessage(userId, `決済処理に失敗しました: ${paymentResult.message || 'エラーが発生しました'}`);
        // 決済方法選択に戻る
        const paymentMethodFlex = createPaymentMethodSelectionFlex(context.orderNumber, context.totalPrice || 3980);
        await lineClient.pushMessage(userId, paymentMethodFlex);
      }
    } else if (text === 'クレジットカードで支払う') {
      await sendTextMessage(userId, 'クレジットカードでの決済を開始します。セキュアな決済ページを準備しています...');

      // Stripe決済処理
      const paymentResult = await processPayment(
        PaymentMethod.CREDIT_CARD,
        context.orderId,
        context.orderNumber,
        context.totalPrice || 3980,
        {}
      );

      if (paymentResult.success && paymentResult.paymentUrl) {
        // Stripeの決済URLを含むFlexメッセージを送信
        const cardPaymentFlex = createCreditCardPaymentFlex(context.orderNumber, paymentResult.paymentUrl);
        await lineClient.pushMessage(userId, cardPaymentFlex);

        // コンテキストにセッションIDを保存
        if (paymentResult.sessionId) {
          context.stripeSessionId = paymentResult.sessionId;
        }

        // 決済中状態に更新
        await updateUserConversationState(userId, ConversationState.PAYMENT_PROCESSING, context);
      } else {
        await sendTextMessage(
          userId,
          `決済処理の準備に失敗しました: ${paymentResult.message || 'エラーが発生しました'}`
        );
        // 決済方法選択に戻る
        const paymentMethodFlex = createPaymentMethodSelectionFlex(context.orderNumber, context.totalPrice || 3980);
        await lineClient.pushMessage(userId, paymentMethodFlex);
      }
    } else if (text === '支払いをキャンセル') {
      await sendTextMessage(
        userId,
        '支払いをキャンセルしました。注文内容の変更が必要な場合は、もう一度写真を送信してください。'
      );
      await updateUserConversationState(userId, ConversationState.WAITING);
    } else {
      await sendTextMessage(
        userId,
        '「LINE Pay」または「クレジットカード」を選択してください。キャンセルする場合は「キャンセル」を選択してください。'
      );
    }
  } catch (error: any) {
    logger.error(`決済方法選択エラー: ${error.message}`);
    await sendTextMessage(userId, '決済処理の開始に失敗しました。もう一度試してください。');
  }
};
