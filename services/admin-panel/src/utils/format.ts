/**
 * 数値を通貨形式（円）に変換する
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(price);
};

/**
 * 数値をカンマ区切りでフォーマットする
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ja-JP').format(num);
};

/**
 * トラッキング番号を配送業者に応じたフォーマットで表示する
 */
export const formatTrackingNumber = (
  trackingNumber: string | null | undefined,
  carrier: string | null | undefined
): string => {
  if (!trackingNumber) return '未設定';

  // 配送業者ごとのフォーマット調整
  switch (carrier?.toLowerCase()) {
    case 'yamato':
    case 'ヤマト運輸':
      // ヤマト運輸の場合は、4桁ごとにハイフンを入れる
      return trackingNumber.replace(/(\d{4})(?=\d)/g, '$1-');

    case 'sagawa':
    case '佐川急便':
      // 佐川急便の場合はそのまま表示
      return trackingNumber;

    case 'japan_post':
    case '日本郵便':
    case 'ゆうパック':
      // 日本郵便の場合は、4桁-4桁-4桁のフォーマット
      if (trackingNumber.length === 12) {
        return `${trackingNumber.substring(0, 4)}-${trackingNumber.substring(4, 8)}-${trackingNumber.substring(8, 12)}`;
      }
      return trackingNumber;

    default:
      return trackingNumber;
  }
};

/**
 * 電話番号をフォーマットする (xxx-xxxx-xxxx)
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';

  // 数字以外を削除
  const cleaned = phone.replace(/\D/g, '');

  // 日本の携帯電話（090, 080, 070から始まる11桁）
  if (cleaned.length === 11 && /^0[789]0/.test(cleaned)) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7, 11)}`;
  }

  // 固定電話（市外局番 + 市内局番 + 番号）
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }

  // その他の場合はそのまま返す
  return phone;
};

/**
 * 郵便番号をフォーマットする (xxx-xxxx)
 */
export const formatPostalCode = (postalCode: string | null | undefined): string => {
  if (!postalCode) return '';

  // 数字以外を削除
  const cleaned = postalCode.replace(/\D/g, '');

  // 日本の郵便番号フォーマット（7桁）
  if (cleaned.length === 7) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}`;
  }

  // その他の場合はそのまま返す
  return postalCode;
};
