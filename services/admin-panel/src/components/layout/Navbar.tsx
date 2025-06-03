// src/components/layout/Navbar.tsx
import {
  Avatar,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { FiBell, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../providers/auth';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <Flex width='100%' alignItems='center' justifyContent='space-between'>
      <Text fontSize='sm' fontWeight='medium' display={{ base: 'none', md: 'flex' }}>
        {/* 現在のページタイトルなど */}
      </Text>

      <HStack spacing={3}>
        <IconButton size='md' variant='ghost' aria-label='通知' icon={<FiBell />} />

        <Menu>
          <MenuButton py={2} transition='all 0.3s' _focus={{ boxShadow: 'none' }}>
            <HStack>
              <Avatar size='sm' name={user?.username || 'Admin User'} />
              <Box display={{ base: 'none', md: 'flex' }}>
                <FiChevronDown />
              </Box>
            </HStack>
          </MenuButton>
          <MenuList bg={useColorModeValue('white', 'gray.900')} borderColor={useColorModeValue('gray.200', 'gray.700')}>
            <MenuItem>プロフィール</MenuItem>
            <MenuItem>設定</MenuItem>
            <MenuDivider />
            <MenuItem onClick={logout}>ログアウト</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};
