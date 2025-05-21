// src/services/faq-service.ts
import { logger } from "../utils/logger";

// FAQ型定義
type FAQ = {
  id: number;
  question: string;
  answer: string;
};

// FAQデータ
const faqs: FAQ[] = [
  {
    id: 1,
    question: "gibteeのTシャツはどのようにして作られますか？",
    answer: "gibteeのTシャツは、お客様からLINEで送信された写真をAIでジブリ風に変換し、高品質なプリント技術でTシャツに転写しています。素材は肌触りの良い綿100%を使用しています。"
  },
  {
    id: 2,
    question: "注文からどのくらいで届きますか？",
    answer: "ご注文から約2週間程度でお届けしています。ただし、注文状況や繁忙期には多少前後する場合があります。発送時にはLINEで追跡番号をお知らせします。"
  },
  {
    id: 3,
    question: "支払い方法は何がありますか？",
    answer: "クレジットカード決済とLINE Pay決済に対応しています。お支払い手続きはすべてLINE上で安全に完結します。"
  },
  {
    id: 4,
    question: "サイズ交換や返品はできますか？",
    answer: "プリントは受注生産のため、原則としてサイズ交換や返品はお受けしておりません。ただし、商品に不備があった場合は、商品到着後7日以内にご連絡ください。"
  },
  {
    id: 5,
    question: "どんな画像でも変換できますか？",
    answer: "基本的には人物や風景の写真が最も変換結果が良くなります。ただし、著作権のある画像や不適切な内容の画像はご利用いただけません。また、変換結果は画像によって異なります。"
  }
];

/**
 * FAQリストを取得する関数
 */
export const getFAQs = async (): Promise<FAQ[]> => {
  try {
    return faqs;
  } catch (error: any) {
    logger.error(`FAQ取得エラー: ${error.message}`);
    throw error;
  }
};

/**
 * 特定のFAQを取得する関数
 */
export const getFAQById = async (id: number): Promise<FAQ | null> => {
  try {
    const faq = faqs.find(item => item.id === id);
    return faq || null;
  } catch (error: any) {
    logger.error(`FAQ取得エラー: ${error.message}`);
    throw error;
  }
};
