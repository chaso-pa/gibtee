import { FlexMessage, FlexContainer } from "@line/bot-sdk";
import { logger } from "../utils/logger.js";

/**
 * ジブリ風変換結果を表示するFlexメッセージを作成
 */
export const createImageConversionResultFlex = (
	originalImageUrl: string,
	ghibliImageUrl: string,
): FlexMessage => {
	logger.info("変換結果Flexメッセージ作成");

	const container: FlexContainer = {
		type: "carousel",
		contents: [
			// 変換後の画像（メイン）
			{
				type: "bubble",
				size: "giga",
				header: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "変換完了！",
							weight: "bold",
							size: "xl",
							color: "#ffffff",
						},
						{
							type: "text",
							text: "ジブリ風に変換しました",
							color: "#ffffffcc",
							size: "md",
						},
					],
					backgroundColor: "#27ACB2",
					paddingTop: "md",
					paddingBottom: "md",
				},
				hero: {
					type: "image",
					url: ghibliImageUrl,
					size: "full",
					aspectRatio: "1:1",
					aspectMode: "cover",
				},
				body: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "ジブリ風画像をTシャツにすることができます。",
							size: "md",
							wrap: true,
							margin: "md",
						},
						{
							type: "text",
							text: "別の写真を送ることもできます。",
							size: "sm",
							color: "#999999",
							margin: "md",
							wrap: true,
						},
					],
					spacing: "md",
					paddingAll: "12px",
				},
				footer: {
					type: "box",
					layout: "horizontal",
					spacing: "sm",
					contents: [
						{
							type: "button",
							style: "secondary",
							action: {
								type: "message",
								label: "別の写真にする",
								text: "やり直す",
							},
							height: "sm",
						},
						{
							type: "button",
							style: "primary",
							action: {
								type: "message",
								label: "Tシャツにする",
								text: "Tシャツにする",
							},
							height: "sm",
						},
					],
					flex: 0,
					paddingAll: "12px",
				},
			},
			// 元の画像（比較用）
			{
				type: "bubble",
				size: "giga",
				header: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "元の写真",
							weight: "bold",
							size: "xl",
							color: "#ffffff",
						},
						{
							type: "text",
							text: "←スワイプして変換後の画像を見る",
							color: "#ffffffcc",
							size: "md",
						},
					],
					backgroundColor: "#888888",
					paddingTop: "md",
					paddingBottom: "md",
				},
				hero: {
					type: "image",
					url: originalImageUrl,
					size: "full",
					aspectRatio: "1:1",
					aspectMode: "cover",
				},
				body: {
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "オリジナル画像",
							weight: "bold",
							size: "lg",
						},
						{
							type: "text",
							text: "← スワイプして変換後の画像を見る",
							size: "sm",
							color: "#999999",
							margin: "md",
							wrap: true,
						},
					],
					spacing: "md",
					paddingAll: "12px",
				},
			},
		],
	};

	return {
		type: "flex",
		altText: "Tシャツにしますか？",
		contents: container,
	};
};

/**
 * Tシャツプレビュー表示用のFlexメッセージを作成
 */
export const createTshirtPreviewFlex = (
	previewImageUrl: string,
	color: string = "white",
): FlexMessage => {
	logger.info("Tシャツプレビュー Flexメッセージ作成");

	// カラーに応じたバックグラウンドカラーを設定
	const backgroundColor =
		color === "white"
			? "#FFFFFF"
			: color === "black"
				? "#111111"
				: color === "navy"
					? "#1A2A5E"
					: color === "red"
						? "#C13B3B"
						: "#FFFFFF";

	// 白色の場合はテキストを黒に、それ以外は白に
	const textColor = color === "white" ? "#111111" : "#FFFFFF";

	const container: FlexContainer = {
		type: "bubble",
		size: "kilo",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "Tシャツプレビュー",
					weight: "bold",
					size: "xl",
					color: "#FFFFFF",
				},
			],
			backgroundColor: "#27ACB2",
			paddingTop: "md",
			paddingBottom: "md",
		},
		hero: {
			type: "image",
			url: previewImageUrl,
			size: "full",
			aspectRatio: "1:1",
			aspectMode: "cover",
			backgroundColor: backgroundColor,
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "どのサイズにしますか？",
					weight: "bold",
					size: "lg",
					wrap: true,
				},
				{
					type: "text",
					text: "Tシャツのサイズを選択してください",
					size: "sm",
					color: "#999999",
					margin: "md",
					wrap: true,
				},
			],
			spacing: "md",
			paddingAll: "12px",
		},
		footer: {
			type: "box",
			layout: "vertical",
			spacing: "sm",
			contents: [
				{
					type: "box",
					layout: "horizontal",
					contents: [
						{
							type: "button",
							style: "primary",
							action: {
								type: "message",
								label: "S",
								text: "Sサイズ",
							},
							height: "sm",
							margin: "md",
						},
						{
							type: "button",
							style: "primary",
							action: {
								type: "message",
								label: "M",
								text: "Mサイズ",
							},
							height: "sm",
							margin: "md",
						},
					],
					spacing: "md",
				},
				{
					type: "box",
					layout: "horizontal",
					contents: [
						{
							type: "button",
							style: "primary",
							action: {
								type: "message",
								label: "L",
								text: "Lサイズ",
							},
							height: "sm",
							margin: "md",
						},
						{
							type: "button",
							style: "primary",
							action: {
								type: "message",
								label: "XL",
								text: "XLサイズ",
							},
							height: "sm",
							margin: "md",
						},
					],
					spacing: "md",
					margin: "md",
				},
				{
					type: "button",
					style: "secondary",
					action: {
						type: "message",
						label: "色を変更する",
						text: "色を変更する",
					},
					margin: "md",
				},
				{
					type: "button",
					style: "secondary",
					action: {
						type: "message",
						label: "やり直す",
						text: "やり直す",
					},
					margin: "md",
				},
			],
			paddingAll: "12px",
		},
	};

	return {
		type: "flex",
		altText: "Tシャツプレビュー",
		contents: container,
	};
};

/**
 * Tシャツカラー選択用のFlexメッセージを作成
 */
export const createColorSelectionFlex = (): FlexMessage => {
	logger.info("カラー選択 Flexメッセージ作成");

	const container: FlexContainer = {
		type: "bubble",
		size: "mega",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "Tシャツカラーを選択",
					weight: "bold",
					size: "xl",
					align: "center",
				},
			],
			paddingTop: "md",
			paddingBottom: "md",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "box",
					layout: "horizontal",
					contents: [
						{
							type: "button",
							action: {
								type: "message",
								label: "ホワイト",
								text: "ホワイト",
							},
							style: "secondary",
							color: "#EEEEEE",
							height: "sm",
						},
						{
							type: "button",
							action: {
								type: "message",
								label: "ブラック",
								text: "ブラック",
							},
							style: "primary",
							color: "#111111",
							height: "sm",
						},
					],
					spacing: "md",
				},
				{
					type: "box",
					layout: "horizontal",
					contents: [
						{
							type: "button",
							action: {
								type: "message",
								label: "ネイビー",
								text: "ネイビー",
							},
							style: "primary",
							color: "#1A2A5E",
							height: "sm",
						},
						{
							type: "button",
							action: {
								type: "message",
								label: "レッド",
								text: "レッド",
							},
							style: "primary",
							color: "#C13B3B",
							height: "sm",
						},
					],
					spacing: "md",
					margin: "md",
				},
			],
			spacing: "md",
			paddingAll: "12px",
		},
		footer: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "button",
					action: {
						type: "message",
						label: "戻る",
						text: "Tシャツプレビューに戻る",
					},
					style: "secondary",
				},
			],
		},
	};

	return {
		type: "flex",
		altText: "Tシャツカラー選択",
		contents: container,
	};
};

/**
 * 数量選択用のFlexメッセージを作成
 */
export const createQuantitySelectionFlex = (): FlexMessage => {
	logger.info("数量選択 Flexメッセージ作成");

	const container: FlexContainer = {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "数量を選択",
					weight: "bold",
					size: "xl",
					align: "center",
				},
			],
			paddingTop: "md",
			paddingBottom: "md",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "希望の数量を選択してください",
					size: "md",
					wrap: true,
					margin: "md",
				},
				{
					type: "box",
					layout: "vertical",
					margin: "lg",
					contents: [
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "1枚",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: "3,980円",
									size: "md",
									align: "end",
									flex: 2,
								},
							],
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "2枚",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: "7,500円（460円お得）",
									size: "md",
									align: "end",
									flex: 2,
								},
							],
							margin: "md",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "3枚以上",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: "3,500円/枚",
									size: "md",
									align: "end",
									flex: 2,
								},
							],
							margin: "md",
						},
					],
				},
			],
			paddingAll: "12px",
		},
		footer: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "box",
					layout: "horizontal",
					contents: [
						{
							type: "button",
							action: {
								type: "message",
								label: "1",
								text: "1枚",
							},
							style: "primary",
							height: "sm",
						},
						{
							type: "button",
							action: {
								type: "message",
								label: "2",
								text: "2枚",
							},
							style: "primary",
							height: "sm",
						},
					],
					spacing: "md",
				},
				{
					type: "box",
					layout: "horizontal",
					contents: [
						{
							type: "button",
							action: {
								type: "message",
								label: "3",
								text: "3枚",
							},
							style: "primary",
							height: "sm",
						},
						{
							type: "button",
							action: {
								type: "message",
								label: "4",
								text: "4枚",
							},
							style: "primary",
							height: "sm",
						},
					],
					spacing: "md",
					margin: "md",
				},
				{
					type: "button",
					action: {
						type: "message",
						label: "戻る",
						text: "サイズ選択に戻る",
					},
					style: "secondary",
					margin: "md",
				},
			],
			spacing: "md",
			paddingAll: "12px",
		},
	};

	return {
		type: "flex",
		altText: "数量を選択",
		contents: container,
	};
};

/**
 * 配送先情報入力の案内メッセージを作成
 */
export const createAddressInputGuideFlex = (): FlexMessage => {
	logger.info("配送先入力案内 Flexメッセージ作成");

	const container: FlexContainer = {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "配送先情報の入力",
					weight: "bold",
					size: "xl",
					align: "center",
				},
			],
			paddingTop: "md",
			paddingBottom: "md",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "これから配送先情報を入力していただきます。以下の順番で質問しますので、それぞれ回答してください。",
					wrap: true,
					size: "md",
				},
				{
					type: "box",
					layout: "vertical",
					margin: "lg",
					contents: [
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "1.",
									size: "md",
									flex: 1,
								},
								{
									type: "text",
									text: "お名前（受取人）",
									size: "md",
									flex: 9,
								},
							],
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "2.",
									size: "md",
									flex: 1,
								},
								{
									type: "text",
									text: "電話番号",
									size: "md",
									flex: 9,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "3.",
									size: "md",
									flex: 1,
								},
								{
									type: "text",
									text: "郵便番号",
									size: "md",
									flex: 9,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "4.",
									size: "md",
									flex: 1,
								},
								{
									type: "text",
									text: "都道府県",
									size: "md",
									flex: 9,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "5.",
									size: "md",
									flex: 1,
								},
								{
									type: "text",
									text: "市区町村",
									size: "md",
									flex: 9,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "6.",
									size: "md",
									flex: 1,
								},
								{
									type: "text",
									text: "番地",
									size: "md",
									flex: 9,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "7.",
									size: "md",
									flex: 1,
								},
								{
									type: "text",
									text: "建物名・部屋番号（任意）",
									size: "md",
									flex: 9,
								},
							],
							margin: "sm",
						},
					],
				},
			],
			paddingAll: "12px",
		},
		footer: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "button",
					action: {
						type: "message",
						label: "入力を開始する",
						text: "配送先の入力を開始",
					},
					style: "primary",
				},
				{
					type: "button",
					action: {
						type: "message",
						label: "キャンセル",
						text: "キャンセル",
					},
					style: "secondary",
					margin: "md",
				},
			],
			paddingAll: "12px",
		},
	};

	return {
		type: "flex",
		altText: "配送先情報の入力",
		contents: container,
	};
};

/**
 * 注文確認用のFlexメッセージを作成
 */
export const createOrderConfirmationFlex = (orderData: {
	color: string;
	size: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	recipientName: string;
	postalCode: string;
	prefecture: string;
	city: string;
	streetAddress: string;
	buildingName?: string;
}): FlexMessage => {
	logger.info("注文確認 Flexメッセージ作成");

	// 日本語の色名を取得
	const colorName = getColorNameJapanese(orderData.color);

	const container: FlexContainer = {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "注文内容の確認",
					weight: "bold",
					size: "xl",
					align: "center",
				},
			],
			paddingTop: "md",
			paddingBottom: "md",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "商品情報",
							weight: "bold",
							size: "lg",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "商品：",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: "ジブリ風オリジナルTシャツ",
									size: "md",
									flex: 7,
									wrap: true,
								},
							],
							margin: "md",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "カラー：",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: colorName,
									size: "md",
									flex: 7,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "サイズ：",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: orderData.size,
									size: "md",
									flex: 7,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "数量：",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: `${orderData.quantity}枚`,
									size: "md",
									flex: 7,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "単価：",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: `${orderData.unitPrice.toLocaleString()}円`,
									size: "md",
									flex: 7,
								},
							],
							margin: "sm",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "合計：",
									size: "md",
									flex: 3,
									weight: "bold",
								},
								{
									type: "text",
									text: `${orderData.totalPrice.toLocaleString()}円（税込）`,
									size: "md",
									flex: 7,
									weight: "bold",
								},
							],
							margin: "sm",
						},
					],
				},
				{
					type: "separator",
					margin: "lg",
				},
				{
					type: "box",
					layout: "vertical",
					contents: [
						{
							type: "text",
							text: "配送先情報",
							weight: "bold",
							size: "lg",
							margin: "lg",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "名前：",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: orderData.recipientName,
									size: "md",
									flex: 7,
									wrap: true,
								},
							],
							margin: "md",
						},
						{
							type: "box",
							layout: "horizontal",
							contents: [
								{
									type: "text",
									text: "住所：",
									size: "md",
									flex: 3,
								},
								{
									type: "text",
									text: `〒${orderData.postalCode}\n${orderData.prefecture}${orderData.city}${orderData.streetAddress}${orderData.buildingName ? "\n" + orderData.buildingName : ""}`,
									size: "md",
									flex: 7,
									wrap: true,
								},
							],
							margin: "sm",
						},
					],
				},
			],
			paddingAll: "12px",
		},
		footer: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "button",
					action: {
						type: "message",
						label: "注文を確定する",
						text: "注文を確定する",
					},
					style: "primary",
				},
				{
					type: "button",
					action: {
						type: "message",
						label: "キャンセル",
						text: "キャンセル",
					},
					style: "secondary",
					margin: "md",
				},
			],
			paddingAll: "12px",
		},
	};

	return {
		type: "flex",
		altText: "注文内容の確認",
		contents: container,
	};
};

/**
 * 決済方法選択用のFlexメッセージを作成
 */
export const createPaymentMethodSelectionFlex = (
	orderNumber: string,
	totalAmount: number,
): FlexMessage => {
	logger.info("決済方法選択 Flexメッセージ作成");

	const container: FlexContainer = {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "お支払い方法選択",
					weight: "bold",
					size: "xl",
					align: "center",
				},
			],
			paddingTop: "md",
			paddingBottom: "md",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: `注文番号: ${orderNumber}`,
					size: "sm",
					color: "#555555",
				},
				{
					type: "text",
					text: `お支払い金額: ${totalAmount.toLocaleString()}円（税込）`,
					size: "md",
					weight: "bold",
					margin: "md",
				},
				{
					type: "text",
					text: "お支払い方法を選択してください",
					size: "md",
					margin: "lg",
				},
				{
					type: "separator",
					margin: "lg",
				},
				{
					type: "box",
					layout: "vertical",
					margin: "lg",
					contents: [
						{
							type: "button",
							action: {
								type: "message",
								label: "クレジットカード",
								text: "クレジットカードで支払う",
							},
							style: "primary",
							color: "#4169E1",
							margin: "md",
						},
					],
				},
			],
			paddingAll: "12px",
		},
		footer: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "button",
					action: {
						type: "message",
						label: "キャンセル",
						text: "支払いをキャンセル",
					},
					style: "secondary",
				},
			],
			paddingAll: "12px",
		},
		styles: {
			header: {
				backgroundColor: "#f0f0f0",
			},
		},
	};

	return {
		type: "flex",
		altText: "お支払い方法の選択",
		contents: container,
	};
};

/**
 * クレジットカード決済（Stripe利用）のFlexメッセージを作成
 */
export const createCreditCardPaymentFlex = (
	orderNumber: string,
	stripeUrl: string,
): FlexMessage => {
	logger.info("クレジットカード決済 Flexメッセージ作成");

	const container: FlexContainer = {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "クレジットカード決済",
					weight: "bold",
					size: "xl",
					align: "center",
				},
			],
			paddingTop: "md",
			paddingBottom: "md",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: `注文番号: ${orderNumber}`,
					size: "sm",
					color: "#555555",
				},
				{
					type: "text",
					text: "安全な決済ページでお支払いを完了してください",
					margin: "md",
					size: "md",
					wrap: true,
				},
				{
					type: "text",
					text: "下記のリンクをタップして、セキュアな決済ページに移動します。",
					margin: "md",
					size: "sm",
					wrap: true,
				},
				{
					type: "box",
					layout: "vertical",
					margin: "xl",
					contents: [
						{
							type: "button",
							action: {
								type: "uri",
								label: "決済ページへ進む",
								uri: stripeUrl,
							},
							style: "primary",
							color: "#3381ff",
						},
					],
				},
				{
					type: "text",
					text: "※決済は安全なStripeのシステムを使用しています。カード情報はgibteeには保存されません。",
					margin: "xl",
					size: "xs",
					color: "#555555",
					wrap: true,
				},
			],
			paddingAll: "12px",
		},
		footer: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "button",
					action: {
						type: "message",
						label: "支払い方法を変更",
						text: "支払い方法選択に戻る",
					},
					style: "secondary",
				},
			],
			paddingAll: "12px",
		},
	};

	return {
		type: "flex",
		altText: "クレジットカード決済",
		contents: container,
	};
};

/**
 * 決済完了メッセージを作成
 */
export const createPaymentCompletedFlex = (
	orderNumber: string,
): FlexMessage => {
	logger.info("決済完了 Flexメッセージ作成");

	const container: FlexContainer = {
		type: "bubble",
		header: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "お支払い完了",
					weight: "bold",
					size: "xl",
					align: "center",
					color: "#FFFFFF",
				},
			],
			paddingTop: "md",
			paddingBottom: "md",
			backgroundColor: "#27AE60",
		},
		body: {
			type: "box",
			layout: "vertical",
			contents: [
				{
					type: "text",
					text: "ご注文ありがとうございます！",
					size: "md",
					weight: "bold",
					align: "center",
				},
				{
					type: "text",
					text: `注文番号：${orderNumber}`,
					margin: "md",
					size: "md",
					align: "center",
				},
				{
					type: "text",
					text: "お支払いが完了しました。",
					margin: "md",
					size: "md",
					align: "center",
				},
				{
					type: "text",
					text: "商品の準備が整い次第発送いたします。",
					margin: "lg",
					wrap: true,
					size: "md",
				},
				{
					type: "text",
					text: "発送時には、LINEでお知らせします。",
					margin: "md",
					wrap: true,
					size: "md",
				},
			],
			paddingAll: "12px",
		},
	};

	return {
		type: "flex",
		altText: "お支払い完了",
		contents: container,
	};
};

/**
 * 色名を日本語表記に変換
 */
const getColorNameJapanese = (colorCode: string): string => {
	switch (colorCode) {
		case "white":
			return "ホワイト";
		case "black":
			return "ブラック";
		case "navy":
			return "ネイビー";
		case "red":
			return "レッド";
		default:
			return "ホワイト";
	}
};
