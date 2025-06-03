import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Text,
  Badge,
  Input,
  Select,
  Stack,
  HStack,
  IconButton,
  FormControl,
  FormLabel,
  Heading,
  Spinner,
  Tooltip
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, RepeatIcon } from '@chakra-ui/icons';
import { useQuery } from '@tanstack/react-query';
import type { OrdersResponse } from '../../types';
import { api } from '../../lib/api';
import { formatDate } from '../../utils/date';
import { formatPrice } from '../../utils/format';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';

// 注文一覧を取得するAPI関数
const fetchOrders = async (params: any) => {
  const queryParams = new URLSearchParams();

  // パラメータをURLクエリパラメータに変換
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const { data } = await api.get<OrdersResponse>(`/api/orders?${queryParams}`);
  return data;
};

export const OrderList: React.FC = () => {
  const navigate = useNavigate();

  // フィルター状態
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    search: '',
    shirtSize: '',
    shirtColor: '',
    isHighPriority: '',
    hasPrintingIssue: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // クエリ実行
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters)
  });

  // フィルター変更ハンドラー
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1 // フィルターが変更されたらページを1に戻す
    }));
  };

  // 検索実行ハンドラー
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // ページ変更ハンドラー
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
  };

  // 注文詳細へ遷移
  const handleViewOrder = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  if (isError) {
    return (
      <Box p={5} textAlign='center'>
        <Text color='red.500'>注文データの取得中にエラーが発生しました。</Text>
        <Button mt={3} colorScheme='blue' onClick={() => refetch()}>
          再試行
        </Button>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading size='lg' mb={5}>
        注文一覧
      </Heading>

      {/* フィルターセクション */}
      <Box bg='white' p={5} borderRadius='md' boxShadow='sm' mb={5}>
        <form onSubmit={handleSearch}>
          <Stack spacing={4}>
            <Flex gap={4} flexWrap='wrap'>
              <FormControl maxW='200px'>
                <FormLabel fontSize='sm'>ステータス</FormLabel>
                <Select name='status' value={filters.status} onChange={handleFilterChange} placeholder='すべて'>
                  <option value='pending'>処理待ち</option>
                  <option value='paid'>支払済み</option>
                  <option value='processing'>処理中</option>
                  <option value='shipped'>発送済み</option>
                  <option value='delivered'>配送完了</option>
                  <option value='cancelled'>キャンセル</option>
                </Select>
              </FormControl>

              <FormControl maxW='200px'>
                <FormLabel fontSize='sm'>サイズ</FormLabel>
                <Select name='shirtSize' value={filters.shirtSize} onChange={handleFilterChange} placeholder='すべて'>
                  <option value='S'>S</option>
                  <option value='M'>M</option>
                  <option value='L'>L</option>
                  <option value='XL'>XL</option>
                </Select>
              </FormControl>

              <FormControl maxW='200px'>
                <FormLabel fontSize='sm'>カラー</FormLabel>
                <Select name='shirtColor' value={filters.shirtColor} onChange={handleFilterChange} placeholder='すべて'>
                  <option value='white'>白</option>
                  <option value='black'>黒</option>
                  <option value='navy'>ネイビー</option>
                  <option value='red'>赤</option>
                </Select>
              </FormControl>

              <FormControl maxW='200px'>
                <FormLabel fontSize='sm'>優先度</FormLabel>
                <Select
                  name='isHighPriority'
                  value={filters.isHighPriority}
                  onChange={handleFilterChange}
                  placeholder='すべて'
                >
                  <option value='true'>優先</option>
                  <option value='false'>通常</option>
                </Select>
              </FormControl>

              <FormControl maxW='200px'>
                <FormLabel fontSize='sm'>印刷問題</FormLabel>
                <Select
                  name='hasPrintingIssue'
                  value={filters.hasPrintingIssue}
                  onChange={handleFilterChange}
                  placeholder='すべて'
                >
                  <option value='true'>あり</option>
                  <option value='false'>なし</option>
                </Select>
              </FormControl>
            </Flex>

            <Flex gap={4} alignItems='flex-end'>
              <FormControl maxW='300px'>
                <FormLabel fontSize='sm'>検索</FormLabel>
                <Input
                  name='search'
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder='注文番号、氏名、電話番号など'
                />
              </FormControl>

              <Button leftIcon={<SearchIcon />} colorScheme='blue' type='submit'>
                検索
              </Button>

              <Button
                leftIcon={<RepeatIcon />}
                variant='outline'
                onClick={() => {
                  setFilters({
                    page: 1,
                    limit: 10,
                    status: '',
                    search: '',
                    shirtSize: '',
                    shirtColor: '',
                    isHighPriority: '',
                    hasPrintingIssue: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                }}
              >
                リセット
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>

      {/* 注文テーブル */}
      <Box bg='white' p={5} borderRadius='md' boxShadow='sm' overflowX='auto'>
        {isLoading ? (
          <Flex justify='center' align='center' h='200px'>
            <Spinner size='xl' />
          </Flex>
        ) : (
          <>
            <Table variant='simple'>
              <Thead>
                <Tr>
                  <Th>注文番号</Th>
                  <Th>ステータス</Th>
                  <Th>顧客名</Th>
                  <Th>サイズ</Th>
                  <Th>カラー</Th>
                  <Th>金額</Th>
                  <Th>注文日</Th>
                  <Th>フラグ</Th>
                  <Th>アクション</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data?.orders.length === 0 ? (
                  <Tr>
                    <Td colSpan={9} textAlign='center' py={10}>
                      該当する注文がありません
                    </Td>
                  </Tr>
                ) : (
                  data?.orders.map((order) => (
                    <Tr key={order.id} _hover={{ bg: 'gray.50' }}>
                      <Td>{order.orderNumber}</Td>
                      <Td>
                        <OrderStatusBadge status={order.status} />
                      </Td>
                      <Td>{order.recipientName || order.user.displayName || '匿名'}</Td>
                      <Td>{order.shirtSize}</Td>
                      <Td>
                        <Badge
                          bg={
                            order.shirtColor === 'white'
                              ? 'gray.100'
                              : order.shirtColor === 'black'
                                ? 'gray.800'
                                : order.shirtColor === 'navy'
                                  ? 'blue.800'
                                  : order.shirtColor === 'red'
                                    ? 'red.500'
                                    : 'gray.200'
                          }
                          color={order.shirtColor === 'white' || order.shirtColor === 'red' ? 'black' : 'white'}
                          px={2}
                          py={1}
                          borderRadius='md'
                        >
                          {order.shirtColor === 'white'
                            ? '白'
                            : order.shirtColor === 'black'
                              ? '黒'
                              : order.shirtColor === 'navy'
                                ? '紺'
                                : order.shirtColor === 'red'
                                  ? '赤'
                                  : order.shirtColor}
                        </Badge>
                      </Td>
                      <Td>{formatPrice(Number(order.price))}</Td>
                      <Td>{formatDate(new Date(order.createdAt))}</Td>
                      <Td>
                        <HStack spacing={1}>
                          {order.isHighPriority && (
                            <Tooltip label='優先対応'>
                              <Badge colorScheme='red' variant='solid'>
                                優先
                              </Badge>
                            </Tooltip>
                          )}
                          {order.hasPrintingIssue && (
                            <Tooltip label='印刷に問題があります'>
                              <Badge colorScheme='orange' variant='solid'>
                                印刷
                              </Badge>
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                      <Td>
                        <Button size='sm' colorScheme='blue' onClick={() => handleViewOrder(order.id)}>
                          詳細
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>

            {/* ページネーション */}
            {data && data.pagination && (
              <Flex justify='space-between' align='center' mt={5}>
                <Text fontSize='sm'>
                  全 {data.pagination.total} 件中 {(data.pagination.page - 1) * data.pagination.limit + 1} -
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} 件表示
                </Text>
                <HStack>
                  <IconButton
                    aria-label='前のページ'
                    icon={<ChevronLeftIcon />}
                    isDisabled={data.pagination.page <= 1}
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                  />
                  <Text fontSize='sm'>
                    {data.pagination.page} / {data.pagination.totalPages || 1}
                  </Text>
                  <IconButton
                    aria-label='次のページ'
                    icon={<ChevronRightIcon />}
                    isDisabled={data.pagination.page >= data.pagination.totalPages}
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                  />
                </HStack>
              </Flex>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
