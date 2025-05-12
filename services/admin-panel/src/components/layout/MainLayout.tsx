// src/components/layout/MainLayout.tsx
import {
	Box,
	Drawer,
	DrawerContent,
	DrawerOverlay,
	Flex,
	IconButton,
	useDisclosure,
} from "@chakra-ui/react";
import { type ReactNode, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { HamburgerIcon } from "@chakra-ui/icons";

export const MainLayout = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const btnRef = useRef<HTMLButtonElement>(null);

	return (
		<Box minH="100vh">
			<Sidebar display={{ base: "none", md: "block" }} onClose={onClose} />
			<Drawer
				isOpen={isOpen}
				placement="left"
				onClose={onClose}
				finalFocusRef={btnRef}
			>
				<DrawerOverlay />
				<DrawerContent>
					<Sidebar onClose={onClose} />
				</DrawerContent>
			</Drawer>
			<Box ml={{ base: 0, md: 60 }} transition=".3s ease">
				<Flex
					as="header"
					position="sticky"
					top={0}
					bg="white"
					boxShadow="sm"
					p={4}
					alignItems="center"
					zIndex={1}
				>
					<IconButton
						aria-label="Menu"
						icon={<HamburgerIcon />}
						display={{ base: "flex", md: "none" }}
						onClick={onOpen}
						variant="outline"
						mr={4}
						ref={btnRef}
					/>
					<Navbar />
				</Flex>
				<Box as="main" p={4}>
					<Outlet />
				</Box>
			</Box>
		</Box>
	);
};
