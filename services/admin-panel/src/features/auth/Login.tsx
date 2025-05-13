import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
	Box,
	Button,
	FormControl,
	FormLabel,
	Input,
	Stack,
	Heading,
	Text,
	useToast,
	Alert,
	AlertIcon,
	FormErrorMessage,
	Flex,
} from "@chakra-ui/react";
import { api } from "../../lib/api";
import { config } from "../../config";

export const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [isEmailInvalid, setIsEmailInvalid] = useState(false);
	const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

	const navigate = useNavigate();
	const location = useLocation();
	const toast = useToast();

	const from = location.state?.from?.pathname || "/dashboard";

	const validateEmail = (email: string) => {
		return email.trim() !== "";
	};

	const validatePassword = (password: string) => {
		return password.trim() !== "";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// バリデーション
		const isEmailValid = validateEmail(email);
		const isPasswordValid = validatePassword(password);

		setIsEmailInvalid(!isEmailValid);
		setIsPasswordInvalid(!isPasswordValid);

		if (!isEmailValid || !isPasswordValid) {
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			// ログインAPI呼び出し
			const response = await api.post("/auth/login", { email, password });

			// ログイン成功
			const { token, user } = response.data;

			// トークンをローカルストレージに保存
			localStorage.setItem("auth_token", token);
			localStorage.setItem("user", JSON.stringify(user));

			// 成功通知
			toast({
				title: "ログイン成功",
				description: "管理画面へようこそ",
				status: "success",
				duration: 3000,
				isClosable: true,
			});

			// リダイレクト
			navigate(from, { replace: true });
		} catch (error: any) {
			// エラー処理
			setError(
				error.response?.data?.message ||
					"ログインに失敗しました。認証情報をご確認ください。",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Flex minH="100vh" align="center" justify="center" bg="gray.50">
			<Box maxW="md" w="full" p={8} bg="white" borderRadius="lg" boxShadow="lg">
				<Stack spacing={6} align="center" mb={8}>
					<Heading size="xl">{config.appName}</Heading>
					<Text fontSize="md" color="gray.600">
						管理者アカウントでログインしてください
					</Text>
				</Stack>

				{error && (
					<Alert status="error" mb={6} borderRadius="md">
						<AlertIcon />
						{error}
					</Alert>
				)}

				<form onSubmit={handleSubmit}>
					<Stack spacing={4}>
						<FormControl isInvalid={isEmailInvalid} isRequired>
							<FormLabel>メールアドレス</FormLabel>
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="メールアドレスを入力"
							/>
							{isEmailInvalid && (
								<FormErrorMessage>メールアドレスは必須です</FormErrorMessage>
							)}
						</FormControl>

						<FormControl isInvalid={isPasswordInvalid} isRequired>
							<FormLabel>パスワード</FormLabel>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="パスワードを入力"
							/>
							{isPasswordInvalid && (
								<FormErrorMessage>パスワードは必須です</FormErrorMessage>
							)}
						</FormControl>

						<Button
							type="submit"
							colorScheme="blue"
							size="lg"
							fontSize="md"
							isLoading={isLoading}
							loadingText="ログイン中..."
							w="full"
							mt={4}
						>
							ログイン
						</Button>
					</Stack>
				</form>

				<Text mt={8} fontSize="sm" color="gray.500" textAlign="center">
					※デモ用アカウント: admin@gibtee.com / adminpassword
				</Text>
			</Box>
		</Flex>
	);
};
