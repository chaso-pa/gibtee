// src/features/dashboard/Dashboard.tsx
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Heading,
  Stack,
  Text,
  Divider,
  Flex
} from '@chakra-ui/react';
import { FiShoppingBag, FiPackage, FiAlertCircle, FiTrendingUp } from 'react-icons/fi';

export const Dashboard = () => {
  return (
    <Box>
      <Heading as='h1' size='lg' mb={6}>
        ダッシュボード
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard
          title='本日の注文数'
          stat='24'
          helpText='前日比 +5'
          icon={<FiShoppingBag size='3em' />}
          iconBg='blue.500'
        />
        <StatCard
          title='未発送の注文'
          stat='12'
          helpText='今すぐ処理を'
          icon={<FiPackage size='3em' />}
          iconBg='orange.500'
        />
        <StatCard
          title='問題のある注文'
          stat='3'
          helpText='対応が必要です'
          icon={<FiAlertCircle size='3em' />}
          iconBg='red.500'
        />
        <StatCard
          title='今月の売上'
          stat='¥580,000'
          helpText='先月比 +12%'
          icon={<FiTrendingUp size='3em' />}
          iconBg='green.500'
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <Card>
          <CardBody>
            <Heading size='md' mb={4}>
              最近の注文
            </Heading>
            <Stack divider={<Divider />} spacing={4}>
              <OrderItem orderNumber='2405-ABCDE1' status='新規注文' price='¥3,980' />
              <OrderItem orderNumber='2405-ABCDE2' status='支払い完了' price='¥7,960' />
              <OrderItem orderNumber='2405-ABCDE3' status='発送準備中' price='¥10,500' />
              <OrderItem orderNumber='2405-ABCDE4' status='問題あり' price='¥3,980' />
              <OrderItem orderNumber='2405-ABCDE5' status='発送済み' price='¥3,980' />
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size='md' mb={4}>
              在庫状況
            </Heading>
            <Stack divider={<Divider />} spacing={4}>
              <InventoryItem item='Tシャツ白 Sサイズ' quantity={15} status='十分' />
              <InventoryItem item='Tシャツ白 Mサイズ' quantity={23} status='十分' />
              <InventoryItem item='Tシャツ黒 Mサイズ' quantity={8} status='要注意' />
              <InventoryItem item='Tシャツ黒 Lサイズ' quantity={3} status='不足' />
              <InventoryItem item='Tシャツ紺 Lサイズ' quantity={12} status='十分' />
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Box>
  );
};

interface StatCardProps {
  title: string;
  stat: string;
  helpText: string;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard = ({ title, stat, helpText, icon, iconBg }: StatCardProps) => {
  return (
    <Stat px={{ base: 2, md: 4 }} py='5' shadow='base' borderColor='gray.200' borderWidth='1px' rounded='lg' bg='white'>
      <Flex justifyContent='space-between'>
        <Box pl={3}>
          <StatLabel fontWeight='medium' isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize='2xl' fontWeight='medium'>
            {stat}
          </StatNumber>
          <StatHelpText>{helpText}</StatHelpText>
        </Box>
        <Box my='auto' color='white' alignContent='center' borderRadius='full' bg={iconBg} p={2}>
          {icon}
        </Box>
      </Flex>
    </Stat>
  );
};

interface OrderItemProps {
  orderNumber: string;
  status: string;
  price: string;
}

const OrderItem = ({ orderNumber, status, price }: OrderItemProps) => {
  return (
    <Flex justify='space-between' align='center'>
      <Box>
        <Text fontWeight='bold'>{orderNumber}</Text>
        <Text fontSize='sm' color='gray.500'>
          {status}
        </Text>
      </Box>
      <Text fontWeight='bold'>{price}</Text>
    </Flex>
  );
};

interface InventoryItemProps {
  item: string;
  quantity: number;
  status: '十分' | '要注意' | '不足';
}

const InventoryItem = ({ item, quantity, status }: InventoryItemProps) => {
  const colorMap = {
    十分: 'green.500',
    要注意: 'orange.500',
    不足: 'red.500'
  };

  return (
    <Flex justify='space-between' align='center'>
      <Box>
        <Text fontWeight='bold'>{item}</Text>
        <Text fontSize='sm' color={colorMap[status]}>
          {status}
        </Text>
      </Box>
      <Text>{quantity}枚</Text>
    </Flex>
  );
};
