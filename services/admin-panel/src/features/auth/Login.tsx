// src/features/auth/Login.tsx
import {
	Box,
	Button,
	FormControl,
	FormLabel,
	Heading,
	Input,
	Stack,
	Text,
	FormErrorMessage,
	useToast,
	InputGroup,
	InputRightElement,
	IconButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { useAuth } from "../../providers/auth";
import { APP_NAME } from "../../config";
import { useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

export const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState({
		email: "",
		password: "",
	});
	const { login, isLoading, error } = useAuth();
	const toast = useToast();
	const navigate = useNavigate();
	const location = useLocation();

	const from = location.state?.from?.pathname || "/dashboard";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrors({ email: "", password: "" });

		let hasError = false;
		if (!email) {
			setErrors((prev) => ({
				...prev,
				email: "メールアドレスを入力してください",
			}));
			hasError = true;
		}
		if (!password) {
			setErrors((prev) => ({
				...prev,
				password: "パスワードを入力してください",
			}));
			hasError = true;
		}

		if (hasError) return;

		try {
			await login({ email, password });
			toast({
				title: "ログイン成功",
				description: "gibtee管理パネルへようこそ",
				status: "success",
				duration: 3000,
				isClosable: true,
			});
			navigate(from, { replace: true });
		} catch (error) {
			// エラーはuseAuthで処理されるため、ここでは何もしない
		}
	};

	return (
		<Box
			minH="100vh"
			display="flex"
			alignItems="center"
			justifyContent="center"
			bg="gray.50"
		>
			<Box
				p={8}
				maxWidth="400px"
				borderWidth={1}
				borderRadius={8}
				boxShadow="lg"
				bg="white"
			>
				<Box textAlign="center" mb={8}>
					<Heading size="lg">{APP_NAME}</Heading>
					<Text mt={2} color="gray.500">
						管理画面にログイン
					</Text>
				</Box>

				{error && (
					<Box my={4} bg="red.50" p={3} borderRadius="md">
						<Text color="red.500" fontSize="sm">
							{error}
						</Text>
					</Box>
				)}

				<form onSubmit={handleSubmit}>
					<Stack spacing={4}>
						<FormControl isInvalid={!!errors.email}>
							<FormLabel htmlFor="email">メールアドレス</FormLabel>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="example@gibtee.com"
							/>
							<FormErrorMessage>{errors.email}</FormErrorMessage>
						</FormControl>

						<FormControl isInvalid={!!errors.password}>
							<FormLabel htmlFor="password">パスワード</FormLabel>
							<InputGroup>
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="パスワードを入力"
								/>
								<InputRightElement>
									<IconButton
										aria-label={
											showPassword ? "パスワードを隠す" : "パスワードを表示"
										}
										icon={showPassword ? <FiEyeOff /> : <FiEye />}
										variant="ghost"
										size="sm"
										onClick={() => setShowPassword(!showPassword)}
									/>
								</InputRightElement>
							</InputGroup>
							<FormErrorMessage>{errors.password}</FormErrorMessage>
						</FormControl>

						<Button
							colorScheme="blue"
							width="full"
							mt={4}
							type="submit"
							isLoading={isLoading}
						>
							ログイン
						</Button>
					</Stack>
				</form>
			</Box>
		</Box>
	);
};
