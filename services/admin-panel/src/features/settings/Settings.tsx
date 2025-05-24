// src/features/settings/Settings.tsx
import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import {
	Box,
	VStack,
	HStack,
	Card,
	CardHeader,
	CardBody,
	Button,
	Switch,
	Textarea,
	FormControl,
	FormLabel,
	FormHelperText,
	Alert,
	AlertIcon,
	Spinner,
	Text,
	Heading,
	useToast,
	Container,
} from "@chakra-ui/react";

interface SystemSettings {
	id: number;
	isOrderAcceptanceEnabled: boolean;
	orderSuspensionMessage: string | null;
	createdAt: string;
	updatedAt: string;
}

export const Settings: React.FC = () => {
	const [settings, setSettings] = useState<SystemSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const toast = useToast();

	const [isOrderAcceptanceEnabled, setIsOrderAcceptanceEnabled] =
		useState(true);
	const [orderSuspensionMessage, setOrderSuspensionMessage] = useState("");

	// 設定を取得
	const fetchSettings = async () => {
		try {
			setLoading(true);
			const res = (await api.get(
				"/api/admin/settings",
			)) satisfies SystemSettings;
			const data = res.data satisfies SystemSettings;
			setSettings(data);
			setIsOrderAcceptanceEnabled(data.isOrderAcceptanceEnabled);
			setOrderSuspensionMessage(data.orderSuspensionMessage || "");
		} catch (error) {
			console.error("Error fetching settings:", error);
			toast({
				title: "エラー",
				description: "設定の取得中にエラーが発生しました",
				status: "error",
				duration: 5000,
				isClosable: true,
			});
		} finally {
			setLoading(false);
		}
	};

	// 設定を保存
	const handleSave = async () => {
		try {
			setSaving(true);
			const updatedSettings = await api.put("/api/admin/settings", {
				body: JSON.stringify({
					isOrderAcceptanceEnabled: isOrderAcceptanceEnabled,
					orderSuspensionMessage: orderSuspensionMessage.trim() || null,
				}),
			});
			if (updatedSettings.data) {
				setSettings(updatedSettings.data);
				toast({
					title: "保存完了",
					description: "設定を保存しました",
					status: "success",
					duration: 3000,
					isClosable: true,
				});
			} else {
				toast({
					title: "エラー",
					description: "設定の保存に失敗しました",
					status: "error",
					duration: 5000,
					isClosable: true,
				});
			}
		} catch (error) {
			console.error("Error saving settings:", error);
			toast({
				title: "エラー",
				description: "設定の保存中にエラーが発生しました",
				status: "error",
				duration: 5000,
				isClosable: true,
			});
		} finally {
			setSaving(false);
		}
	};

	useEffect(() => {
		fetchSettings();
	}, []);

	if (loading) {
		return (
			<Container maxW="container.lg" py={8}>
				<VStack spacing={4} justify="center" minH="50vh">
					<Spinner size="xl" color="blue.500" />
					<Text>設定を読み込み中...</Text>
				</VStack>
			</Container>
		);
	}

	return (
		<Container maxW="container.lg" py={8}>
			<VStack spacing={8} align="stretch">
				{/* ヘッダー */}
				<Box>
					<Heading as="h1" size="xl" mb={2}>
						システム設定
					</Heading>
					<Text color="gray.600">サービスの基本設定を管理します</Text>
				</Box>

				{/* 注文受付設定カード */}
				<Card>
					<CardHeader>
						<VStack align="start" spacing={2}>
							<Heading as="h2" size="lg">
								注文受付設定
							</Heading>
							<Text color="gray.600" fontSize="sm">
								新規注文の受付を一時的に停止することができます。メンテナンス時やサービス停止時にご利用ください。
							</Text>
						</VStack>
					</CardHeader>
					<CardBody>
						<VStack spacing={6} align="stretch">
							{/* 注文受付スイッチ */}
							<FormControl>
								<HStack justify="space-between">
									<FormLabel htmlFor="order-acceptance" mb={0}>
										新規注文を受け付ける
									</FormLabel>
									<Switch
										id="order-acceptance"
										isChecked={isOrderAcceptanceEnabled}
										onChange={(e) =>
											setIsOrderAcceptanceEnabled(e.target.checked)
										}
										colorScheme="blue"
										size="lg"
									/>
								</HStack>
							</FormControl>

							{/* 受付停止時のメッセージ入力 */}
							{!isOrderAcceptanceEnabled && (
								<FormControl>
									<FormLabel>受付停止時のメッセージ</FormLabel>
									<Textarea
										placeholder="現在サービスを一時停止しております。ご迷惑をおかけして申し訳ございません。"
										value={orderSuspensionMessage}
										onChange={(e) => setOrderSuspensionMessage(e.target.value)}
										rows={4}
										maxLength={500}
										resize="vertical"
									/>
									<FormHelperText>
										{orderSuspensionMessage.length}/500文字 -
										注文受付停止時にユーザーに表示されるメッセージです
									</FormHelperText>
								</FormControl>
							)}

							{/* 保存ボタン */}
							<HStack>
								<Button
									colorScheme="blue"
									onClick={handleSave}
									isLoading={saving}
									loadingText="保存中..."
									leftIcon={saving ? undefined : <Text>💾</Text>}
								>
									設定を保存
								</Button>
							</HStack>

							{/* 注意メッセージ */}
							{!isOrderAcceptanceEnabled && (
								<Alert status="warning" borderRadius="md">
									<AlertIcon />
									<Box>
										<Text fontWeight="bold">注意:</Text>
										<Text fontSize="sm">
											現在、新規注文の受付が停止されています。
											ユーザーがLINEボットで注文を開始しようとした際に、設定したメッセージが表示されます。
										</Text>
									</Box>
								</Alert>
							)}
						</VStack>
					</CardBody>
				</Card>

				{/* 設定情報カード */}
				{settings && (
					<Card>
						<CardHeader>
							<Heading as="h3" size="md">
								設定情報
							</Heading>
						</CardHeader>
						<CardBody>
							<VStack spacing={3} align="start">
								<HStack>
									<Text fontWeight="medium" minW="100px">
										最終更新:
									</Text>
									<Text>
										{new Date(settings.updatedAt).toLocaleString("ja-JP")}
									</Text>
								</HStack>
								<HStack>
									<Text fontWeight="medium" minW="100px">
										作成日時:
									</Text>
									<Text>
										{new Date(settings.createdAt).toLocaleString("ja-JP")}
									</Text>
								</HStack>
							</VStack>
						</CardBody>
					</Card>
				)}
			</VStack>
		</Container>
	);
};
