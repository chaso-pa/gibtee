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
							text: "このデザインでTシャツを作りますか？",
							weight: "bold",
							size: "lg",
							wrap: true,
							margin: "md",
						},
						{
							type: "text",
							text: "気に入らない場合は別の写真を送ることもできます。",
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
		altText: "ジブリ風変換結果",
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
