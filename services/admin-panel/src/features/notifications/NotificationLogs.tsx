import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  SearchIcon,
  RepeatIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon,
  InfoIcon,
  CheckIcon,
  WarningIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatDate, timeAgo } from '../../utils/date';
import type { Notification } from '../../types';

interface FetchNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  success?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
}

// 通知履歴を取得する関数
const fetchNotifications = async ({
  page = 1,
  limit = 10,
  type,
  success,
  orderId,
  startDate,
  endDate
}: FetchNotificationsParams) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  if (type) params.append('type', type);
  if (success !== undefined) params.append('success', success);
  if (orderId) params.append('orderId', orderId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const { data } = await api.get(`/api/notifications?${params.toString()}`);
  return data;
};

const NotificationLogs = () => {
  // フィルター状態
  const [filters, setFilters] = useState({
    type: '',
    success: '',
    orderId: '',
    startDate: '',
    endDate: ''
  });

  // ページネーション状態
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });

  // フィルターフォーム状態
  const [filterForm, setFilterForm] = useState({
    type: '',
    success: '',
    orderId: '',
    startDate: '',
    endDate: ''
  });

  // 通知データを取得
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', { ...pagination, ...filters }],
    queryFn: () => fetchNotifications({ ...pagination, ...filters })
  });

  // フィルター適用
  const applyFilters = (e: any) => {
    e.preventDefault();
    setFilters({ ...filterForm });
    setPagination({ ...pagination, page: 1 }); // フィルター適用時は1ページ目に戻る
  };

  // フィルターリセット
  const resetFilters = () => {
    setFilterForm({
      type: '',
      success: '',
      orderId: '',
      startDate: '',
      endDate: ''
    });
    setFilters({
      type: '',
      success: '',
      orderId: '',
      startDate: '',
      endDate: ''
    });
    setPagination({ ...pagination, page: 1 });
  };

  // ページ変更
  const changePage = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  // 通知種類のバッジスタイル
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'STATUS_UPDATE':
        return {
          colorScheme: 'blue',
          icon: <RepeatIcon mr={1} />,
          label: 'ステータス通知'
        };
      case 'SHIPPING_UPDATE':
        return {
          colorScheme: 'teal',
          icon: <BellIcon mr={1} />,
          label: '発送通知'
        };
      case 'ORDER_REMINDER':
        return {
          colorScheme: 'purple',
          icon: <TimeIcon mr={1} />,
          label: '注文リマインダー'
        };
      case 'PAYMENT_REMINDER':
        return {
          colorScheme: 'orange',
          icon: <InfoIcon mr={1} />,
          label: '支払いリマインダー'
        };
      default:
        return { colorScheme: 'gray', icon: <InfoIcon mr={1} />, label: type };
    }
  };

  return (
    <Box p={5}>
      {/* ヘッダー */}
      <Heading size='lg' mb={5}>
        通知ログ管理
      </Heading>

      {/* フィルターカード */}
      <Card mb={5}>
        <CardHeader>
          <Heading size='md'>検索フィルター</Heading>
        </CardHeader>
        <CardBody>
          <form onSubmit={applyFilters}>
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
              <FormControl>
                <FormLabel>通知タイプ</FormLabel>
                <Select
                  placeholder='すべて'
                  value={filterForm.type}
                  onChange={(e) => setFilterForm({ ...filterForm, type: e.target.value })}
                >
                  <option value='STATUS_UPDATE'>ステータス通知</option>
                  <option value='SHIPPING_UPDATE'>発送通知</option>
                  <option value='ORDER_REMINDER'>注文リマインダー</option>
                  <option value='PAYMENT_REMINDER'>支払いリマインダー</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>送信結果</FormLabel>
                <Select
                  placeholder='すべて'
                  value={filterForm.success}
                  onChange={(e) => setFilterForm({ ...filterForm, success: e.target.value })}
                >
                  <option value='true'>成功</option>
                  <option value='false'>失敗</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>注文ID</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents='none'>
                    <SearchIcon color='gray.300' />
                  </InputLeftElement>
                  <Input
                    placeholder='注文IDで検索'
                    value={filterForm.orderId}
                    onChange={(e) => setFilterForm({ ...filterForm, orderId: e.target.value })}
                  />
                </InputGroup>
              </FormControl>
            </Flex>

            <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={4}>
              <FormControl>
                <FormLabel>開始日</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents='none'>
                    <CalendarIcon color='gray.300' />
                  </InputLeftElement>
                  <Input
                    type='date'
                    value={filterForm.startDate}
                    onChange={(e) =>
                      setFilterForm({
                        ...filterForm,
                        startDate: e.target.value
                      })
                    }
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel>終了日</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents='none'>
                    <CalendarIcon color='gray.300' />
                  </InputLeftElement>
                  <Input
                    type='date'
                    value={filterForm.endDate}
                    onChange={(e) => setFilterForm({ ...filterForm, endDate: e.target.value })}
                  />
                </InputGroup>
              </FormControl>

              <Box alignSelf='flex-end'>
                <HStack spacing={2}>
                  <Button colorScheme='gray' onClick={resetFilters} isDisabled={isLoading}>
                    リセット
                  </Button>
                  <Button colorScheme='blue' type='submit' leftIcon={<SearchIcon />} isLoading={isLoading}>
                    検索
                  </Button>
                </HStack>
              </Box>
            </Flex>
          </form>
        </CardBody>
      </Card>

      {/* 通知一覧 */}
      <Card>
        <CardHeader>
          <Flex justifyContent='space-between' alignItems='center'>
            <Heading size='md'>通知履歴</Heading>
            <HStack>
              <Button size='sm' leftIcon={<RepeatIcon />} onClick={() => refetch()} isLoading={isLoading}>
                更新
              </Button>
            </HStack>
          </Flex>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Flex justify='center' align='center' py={10}>
              <Spinner size='xl' />
            </Flex>
          ) : isError ? (
            <Alert status='error'>
              <AlertIcon />
              <Text>データの取得中にエラーが発生しました。再度お試しください。</Text>
            </Alert>
          ) : data?.notifications?.length > 0 ? (
            <>
              <Table variant='simple'>
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>注文ID</Th>
                    <Th>種類</Th>
                    <Th>状態</Th>
                    <Th>送信日時</Th>
                    <Th>内容</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.notifications.map((notification: Notification) => {
                    const typeStyle = getTypeStyle(notification.type);

                    // 通知内容をパース
                    let content = {};
                    try {
                      content = JSON.parse(notification.content);
                    } catch (e) {
                      console.error('通知内容のパースに失敗:', e);
                    }

                    return (
                      <Tr key={notification.id}>
                        <Td>{notification.id}</Td>
                        <Td>
                          <Button
                            size='xs'
                            variant='link'
                            colorScheme='blue'
                            onClick={() => window.open(`/orders/${notification.orderId}`, '_blank')}
                          >
                            #{notification.orderId}
                          </Button>
                        </Td>
                        <Td>
                          <Badge colorScheme={typeStyle.colorScheme}>
                            {typeStyle.icon} {typeStyle.label}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={notification.success ? 'green' : 'red'}>
                            {notification.success ? (
                              <>
                                <CheckIcon mr={1} /> 成功
                              </>
                            ) : (
                              <>
                                <WarningIcon mr={1} /> 失敗
                              </>
                            )}
                          </Badge>
                        </Td>
                        <Td>
                          <Tooltip label={formatDate(new Date(notification.sentAt))}>
                            <Text>{timeAgo(new Date(notification.sentAt))}</Text>
                          </Tooltip>
                        </Td>
                        <Td maxWidth='300px'>
                          {/* @ts-ignore */}
                          <Tooltip label={content.message || '-'}>
                            {/* @ts-ignore */}
                            <Text noOfLines={1}>{content.message || '-'}</Text>
                          </Tooltip>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>

              {/* ページネーション */}
              {data.pagination && (
                <Flex justify='space-between' align='center' mt={4}>
                  <Text color='gray.500'>
                    全 {data.pagination.total} 件中 {(pagination.page - 1) * pagination.limit + 1} -{' '}
                    {Math.min(pagination.page * pagination.limit, data.pagination.total)} 件を表示
                  </Text>
                  <HStack>
                    <IconButton
                      icon={<ChevronLeftIcon />}
                      onClick={() => changePage(Math.max(1, pagination.page - 1))}
                      isDisabled={pagination.page <= 1}
                      aria-label='前のページ'
                    />
                    <Text>
                      {pagination.page} / {data.pagination.totalPages || 1}
                    </Text>
                    <IconButton
                      icon={<ChevronRightIcon />}
                      onClick={() => changePage(Math.min(data.pagination.totalPages, pagination.page + 1))}
                      isDisabled={pagination.page >= data.pagination.totalPages}
                      aria-label='次のページ'
                    />
                  </HStack>
                </Flex>
              )}
            </>
          ) : (
            <Box textAlign='center' py={10}>
              <InfoIcon boxSize='40px' color='gray.400' mb={3} />
              <Text color='gray.500'>通知履歴が見つかりません</Text>
              {Object.values(filters).some((val) => val !== '') && (
                <Button mt={4} size='sm' onClick={resetFilters}>
                  フィルターをクリア
                </Button>
              )}
            </Box>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default NotificationLogs;
