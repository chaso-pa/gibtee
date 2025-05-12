// src/providers/app.tsx
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter as Router } from "react-router-dom";
import { theme } from "../config/theme";
import { AuthProvider } from "./auth";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: false,
			staleTime: 1000 * 60 * 5, // 5分
		},
	},
});

type AppProviderProps = {
	children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
	return (
		<QueryClientProvider client={queryClient}>
			<ChakraProvider theme={theme}>
				<Router>
					<AuthProvider>{children}</AuthProvider>
				</Router>
			</ChakraProvider>
			<ReactQueryDevtools />
		</QueryClientProvider>
	);
};
