// src/components/layout/Sidebar.tsx
import {
	Box,
	CloseButton,
	Flex,
	Text,
	type BoxProps,
	Link,
	VStack,
	Heading,
	Icon,
} from "@chakra-ui/react";
import { NavLink as RouterLink, useLocation } from "react-router-dom";
import {
	FiHome,
	FiShoppingBag,
	FiBox,
	FiSettings,
	FiBarChart2,
	FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { APP_NAME } from "../../config";

interface SidebarProps extends BoxProps {
	onClose: () => void;
}

interface LinkItemProps {
	name: string;
	icon: IconType;
	to: string;
}

const LinkItems: Array<LinkItemProps> = [
	{ name: "ダッシュボード", icon: FiHome, to: "/dashboard" },
	{ name: "注文管理", icon: FiShoppingBag, to: "/orders" },
	{ name: "在庫管理", icon: FiBox, to: "/inventory" },
	{ name: "ユーザー管理", icon: FiUsers, to: "/users" },
	{ name: "レポート", icon: FiBarChart2, to: "/reports" },
	{ name: "設定", icon: FiSettings, to: "/settings" },
];

export const Sidebar = ({ onClose, ...rest }: SidebarProps) => {
	return (
		<Box
			bg="white"
			borderRight="1px"
			borderRightColor="gray.200"
			w={{ base: "full", md: 60 }}
			pos="fixed"
			h="full"
			{...rest}
		>
			<Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
				<Heading as="h1" fontSize="2xl" fontWeight="bold">
					{APP_NAME}
				</Heading>
				<CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
			</Flex>
			<VStack spacing={1} align="stretch" px={4} py={4}>
				{LinkItems.map((link) => (
					<NavItem key={link.name} icon={link.icon} to={link.to}>
						{link.name}
					</NavItem>
				))}
			</VStack>
		</Box>
	);
};

interface NavItemProps {
	icon: IconType;
	to: string;
	children: string;
}

const NavItem = ({ icon, to, children }: NavItemProps) => {
	const location = useLocation();
	const isActive = location.pathname.startsWith(to);

	return (
		<Link
			as={RouterLink}
			to={to}
			style={{ textDecoration: "none" }}
			_focus={{ boxShadow: "none" }}
		>
			<Flex
				align="center"
				p="4"
				mx="2"
				borderRadius="lg"
				role="group"
				cursor="pointer"
				bg={isActive ? "brand.50" : "transparent"}
				color={isActive ? "brand.600" : "gray.600"}
				fontWeight={isActive ? "medium" : "normal"}
				_hover={{
					bg: "brand.50",
					color: "brand.600",
				}}
			>
				{icon && <Icon mr="4" fontSize="16" as={icon} />}
				{children}
			</Flex>
		</Link>
	);
};
