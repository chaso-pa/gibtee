import type React from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Text,
  Heading,
  Badge,
  SimpleGrid,
  Divider,
  HStack,
  VStack,
  Image,
  Spinner,
  useToast,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  Thead,
  Card,
  CardHeader,
  CardBody,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Switch,
  Tooltip,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  EditIcon,
  CheckIcon,
  WarningIcon,
  StarIcon,
  ExternalLinkIcon,
  BellIcon,
  InfoIcon,
  RepeatIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Order, OrderStatus, Payment, Notification, OrderHistory } from '../../types';
import { OrderStatusBadge } from '../../components/common/OrderStatusBadge';
import { formatDate, timeAgo } from '../../utils/date';
import { formatPrice, formatPhoneNumber, formatPostalCode, formatTrackingNumber } from '../../utils/format';

// 注文詳細を取得する関数
const fetchOrderDetail = async (orderId: string) => {
  const { data } = await api.get<{ order: Order }>(`/api/orders/${orderId}`);
  return data.order;
};

// 注文ステータス更新API関数
const updateOrderStatus = async ({
  orderId,
  status,
  adminMemo,
  notifyCustomer
}: {
  orderId: string;
  status: OrderStatus;
  adminMemo?: string;
  notifyCustomer: boolean;
}) => {
  const { data } = await api.patch(`/api/orders/${orderId}/status`, {
    status,
    adminMemo,
    notifyCustomer
  });
  return data;
};

// 配送情報更新API関数
const updateShippingInfo = async ({
  orderId,
  shippingCarrier,
  trackingNumber,
  shippedAt,
  estimatedDeliveryAt,
  notifyCustomer
}: {
  orderId: string;
  shippingCarrier: string;
  trackingNumber: string;
  shippedAt: string;
  estimatedDeliveryAt?: string;
  notifyCustomer: boolean;
}) => {
  const { data } = await api.patch(`/api/orders/${orderId}/shipping`, {
    shippingCarrier,
    trackingNumber,
    shippedAt,
    estimatedDeliveryAt,
    notifyCustomer
  });
  return data;
};

// 通知履歴取得API関数
const fetchOrderNotifications = async (orderId: string) => {
  const { data } = await api.get<{ notifications: Notification[] }>(`/api/orders/${orderId}/notifications`);
  return data.notifications;
};

const useImageSignedUrl = (imageId: number | undefined) => {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageId) return;

    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/api/images/${imageId}/signed-url`);
        setUrl(data.url);
      } catch (err: any) {
        setError(err.response?.data?.message || '画像URLの取得に失敗しました');
        console.error('画像URL取得エラー:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrl();
  }, [imageId]);

  return { url, isLoading, error };
};

export const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // モーダル操作用の状態
  const { isOpen: isStatusModalOpen, onOpen: onStatusModalOpen, onClose: onStatusModalClose } = useDisclosure();

  const { isOpen: isShippingModalOpen, onOpen: onShippingModalOpen, onClose: onShippingModalClose } = useDisclosure();

  // フォーム状態
  const [statusForm, setStatusForm] = useState({
    status: '',
    adminMemo: '',
    notifyCustomer: true
  });

  const [shippingForm, setShippingForm] = useState({
    shippingCarrier: '',
    trackingNumber: '',
    shippedAt: '',
    estimatedDeliveryAt: '',
    notifyCustomer: true
  });

  // 注文詳細データを取得
  const {
    data: order,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderDetail(orderId || ''),
    enabled: !!orderId
  });

  // 通知履歴データを取得
  const {
    data: notifications,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['orderNotifications', orderId],
    queryFn: () => fetchOrderNotifications(orderId || ''),
    enabled: !!orderId
  });

  // ステータス更新ミューテーション
  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      toast({
        title: 'ステータスを更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({
        queryKey: ['orderNotifications', orderId]
      });
      onStatusModalClose();
    },
    onError: (error: any) => {
      toast({
        title: 'ステータス更新に失敗しました',
        description: error.response?.data?.message || 'エラーが発生しました',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  });

  // 配送情報更新ミューテーション
  const updateShippingMutation = useMutation({
    mutationFn: updateShippingInfo,
    onSuccess: () => {
      toast({
        title: '配送情報を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({
        queryKey: ['orderNotifications', orderId]
      });
      onShippingModalClose();
    },
    onError: (error: any) => {
      toast({
        title: '配送情報の更新に失敗しました',
        description: error.response?.data?.message || 'エラーが発生しました',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  });

  // ステータス更新モーダルを開く
  const handleOpenStatusModal = () => {
    if (order) {
      setStatusForm({
        status: order.status,
        adminMemo: order.adminMemo || '',
        notifyCustomer: true
      });
      onStatusModalOpen();
    }
  };

  // 配送情報モーダルを開く
  const handleOpenShippingModal = () => {
    if (order) {
      setShippingForm({
        shippingCarrier: order.shippingCarrier || '',
        trackingNumber: order.trackingNumber || '',
        shippedAt: order.shippedAt
          ? new Date(order.shippedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        estimatedDeliveryAt: order.estimatedDeliveryAt
          ? new Date(order.estimatedDeliveryAt).toISOString().split('T')[0]
          : '',
        notifyCustomer: true
      });
      onShippingModalOpen();
    }
  };

  // ステータス更新を実行
  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
      updateStatusMutation.mutate({
        orderId,
        status: statusForm.status as OrderStatus,
        adminMemo: statusForm.adminMemo,
        notifyCustomer: statusForm.notifyCustomer
      });
    }
  };

  // 配送情報更新を実行
  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId) {
      updateShippingMutation.mutate({
        orderId,
        ...shippingForm
      });
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <Box p={5} display={'flex'} justifyContent='center' alignItems='center'>
        <Spinner size='xl' />
      </Box>
    );
  }

  // エラー表示
  if (isError || !order) {
    return (
      <Box p={5}>
        <Alert status='error'>
          <AlertIcon />
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription>注文情報の取得に失敗しました。</AlertDescription>
        </Alert>
        <Button mt={4} leftIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
          注文一覧に戻る
        </Button>
      </Box>
    );
  }

  // 注文詳細ビュー
  return (
    <Box p={5}>
      {/* ヘッダーセクション */}
      <Flex justifyContent='space-between' alignItems='center' mb={5}>
        <Button leftIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>
          注文一覧に戻る
        </Button>
        <Heading size='lg'>注文詳細: {order.orderNumber}</Heading>
        <HStack>
          {order.isHighPriority && (
            <Badge colorScheme='red' p={2} borderRadius='md'>
              <StarIcon mr={1} /> 優先出荷
            </Badge>
          )}
          {order.hasPrintingIssue && (
            <Badge colorScheme='orange' p={2} borderRadius='md'>
              <WarningIcon mr={1} /> 印刷問題あり
            </Badge>
          )}
        </HStack>
      </Flex>

      {/* メインコンテント */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        {/* 左カラム */}
        <Box>
          {/* 基本情報 */}
          <Card mb={5}>
            <CardHeader>
              <Flex justifyContent='space-between' alignItems='center'>
                <Heading size='md'>基本情報</Heading>
                <OrderStatusBadge status={order.status} />
              </Flex>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    注文番号
                  </Text>
                  <Text>{order.orderNumber}</Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    注文日時
                  </Text>
                  <Text>{formatDate(new Date(order.createdAt))}</Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    サイズ
                  </Text>
                  <Text>{order.shirtSize}</Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    カラー
                  </Text>
                  <Text>
                    {order.shirtColor === 'white'
                      ? '白'
                      : order.shirtColor === 'black'
                        ? '黒'
                        : order.shirtColor === 'navy'
                          ? '紺'
                          : order.shirtColor === 'red'
                            ? '赤'
                            : order.shirtColor}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    数量
                  </Text>
                  <Text>{order.quantity}枚</Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    支払金額
                  </Text>
                  <Text>{formatPrice(Number(order.price))}</Text>
                </Box>
              </SimpleGrid>

              <Divider my={4} />

              <SimpleGrid columns={1} spacing={4}>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    管理者メモ
                  </Text>
                  <Text color={order.adminMemo ? 'black' : 'gray.500'}>{order.adminMemo || 'メモはありません'}</Text>
                </Box>
              </SimpleGrid>

              <HStack mt={4} spacing={4}>
                <Button leftIcon={<EditIcon />} colorScheme='blue' size='sm' onClick={handleOpenStatusModal}>
                  ステータス変更
                </Button>
              </HStack>
            </CardBody>
          </Card>

          {/* 顧客情報 */}
          <Card mb={5}>
            <CardHeader>
              <Heading size='md'>顧客情報</Heading>
            </CardHeader>
            <CardBody>
              <HStack spacing={4} mb={4}>
                {order.user?.profileImageUrl && (
                  <Image
                    src={order.user.profileImageUrl}
                    alt='ユーザープロフィール画像'
                    boxSize='50px'
                    borderRadius='full'
                  />
                )}
                <Box>
                  <Text fontWeight='bold'>{order.user?.displayName || '名前未設定'}</Text>
                  <Text fontSize='sm'>LINE ID: {order.user?.lineUserId}</Text>
                </Box>
              </HStack>

              <Divider my={4} />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    配送先
                  </Text>
                  <Text>{order.recipientName}</Text>
                  <Text>{formatPostalCode(order.postalCode)}</Text>
                  <Text>
                    {order.prefecture} {order.city}
                  </Text>
                  <Text>{order.streetAddress}</Text>
                  <Text>{order.buildingName}</Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    連絡先
                  </Text>
                  <Text>{formatPhoneNumber(order.recipientPhone)}</Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* 配送情報 */}
          <Card mb={5}>
            <CardHeader>
              <Heading size='md'>配送情報</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    配送業者
                  </Text>
                  <Text color={order.shippingCarrier ? 'black' : 'gray.500'}>{order.shippingCarrier || '未設定'}</Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    追跡番号
                  </Text>
                  {order.trackingNumber ? (
                    <HStack>
                      <Text>{formatTrackingNumber(order.trackingNumber, order.shippingCarrier)}</Text>
                      <IconButton
                        as='a'
                        href={`https://www.google.com/search?q=${order.trackingNumber}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label='追跡'
                        icon={<ExternalLinkIcon />}
                        size='xs'
                      />
                    </HStack>
                  ) : (
                    <Text color='gray.500'>未設定</Text>
                  )}
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    発送日
                  </Text>
                  <Text color={order.shippedAt ? 'black' : 'gray.500'}>
                    {order.shippedAt ? formatDate(new Date(order.shippedAt)) : '未発送'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    お届け予定日
                  </Text>
                  <Text color={order.estimatedDeliveryAt ? 'black' : 'gray.500'}>
                    {order.estimatedDeliveryAt ? formatDate(new Date(order.estimatedDeliveryAt)) : '未設定'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight='bold' fontSize='sm'>
                    顧客通知状況
                  </Text>
                  <HStack>
                    <Badge colorScheme={order.notifiedShipping ? 'green' : 'gray'}>
                      {order.notifiedShipping ? '発送通知済み' : '未通知'}
                    </Badge>
                    <Tooltip label='配送情報をLINEに通知済みかどうかを示します'>
                      <InfoIcon color='gray.500' />
                    </Tooltip>
                  </HStack>
                </Box>
              </SimpleGrid>

              <Button mt={4} leftIcon={<EditIcon />} colorScheme='teal' size='sm' onClick={handleOpenShippingModal}>
                配送情報更新
              </Button>
            </CardBody>
          </Card>
        </Box>

        {/* 右カラム */}
        <Box>
          {/* 商品画像 */}
          <Card mb={5}>
            <CardHeader>
              <Heading size='md'>商品画像</Heading>
            </CardHeader>
            <CardBody>
              {order.image ? (
                <ProductImage imageId={order.image.id} altText='ジブリ加工生成画像' />
              ) : (
                <Box
                  bg='gray.100'
                  height='300px'
                  borderRadius='md'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Text color='gray.500'>画像がありません</Text>
                </Box>
              )}
            </CardBody>
          </Card>

          {/* 支払い情報 */}
          <Card mb={5}>
            <CardHeader>
              <Heading size='md'>支払い情報</Heading>
            </CardHeader>
            <CardBody>
              {order.payments && order.payments.length > 0 ? (
                <Table variant='simple' size='sm'>
                  <Thead>
                    <Tr>
                      <Th>支払い方法</Th>
                      <Th>金額</Th>
                      <Th>ステータス</Th>
                      <Th>日時</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {order.payments.map((payment: Payment) => (
                      <Tr key={payment.id}>
                        <Td>
                          {payment.method === 'LINE_PAY'
                            ? 'LINE Pay'
                            : payment.method === 'CREDIT_CARD'
                              ? 'クレジットカード'
                              : payment.method}
                        </Td>
                        <Td>{formatPrice(payment.amount)}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              payment.status === 'COMPLETED'
                                ? 'green'
                                : payment.status === 'PENDING'
                                  ? 'yellow'
                                  : payment.status === 'FAILED'
                                    ? 'red'
                                    : 'gray'
                            }
                          >
                            {payment.status === 'COMPLETED'
                              ? '完了'
                              : payment.status === 'PENDING'
                                ? '処理中'
                                : payment.status === 'FAILED'
                                  ? '失敗'
                                  : payment.status === 'CANCELLED'
                                    ? 'キャンセル'
                                    : payment.status}
                          </Badge>
                        </Td>
                        <Td>{formatDate(new Date(payment.createdAt))}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text color='gray.500'>支払い情報がありません</Text>
              )}
            </CardBody>
          </Card>

          {/* タブパネル（通知履歴と注文履歴） */}
          <Card>
            <CardHeader>
              <Heading size='md'>履歴情報</Heading>
            </CardHeader>
            <CardBody>
              <Tabs variant='enclosed' colorScheme='blue'>
                <TabList>
                  <Tab>注文履歴</Tab>
                  <Tab>
                    通知履歴
                    {notifications && notifications.length > 0 && (
                      <Badge ml={2} colorScheme='blue' borderRadius='full'>
                        {notifications.length}
                      </Badge>
                    )}
                  </Tab>
                </TabList>
                <TabPanels>
                  {/* 注文履歴タブ */}
                  <TabPanel p={3}>
                    {order.orderHistories && order.orderHistories.length > 0 ? (
                      <VStack align='stretch' spacing={3}>
                        {order.orderHistories.map((history: OrderHistory) => (
                          <Box
                            key={history.id}
                            p={3}
                            borderRadius='md'
                            bg='gray.50'
                            borderLeft='4px solid'
                            borderLeftColor='blue.400'
                          >
                            <Flex justifyContent='space-between' mb={1}>
                              <Badge colorScheme='blue'>{history.status}</Badge>
                              <Text fontSize='xs' color='gray.500'>
                                {timeAgo(new Date(history.createdAt))}
                              </Text>
                            </Flex>
                            <Text>{history.message}</Text>
                            <Text fontSize='xs' mt={1} color='gray.600'>
                              更新者: {history.createdBy}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Text color='gray.500'>履歴がありません</Text>
                    )}
                  </TabPanel>

                  {/* 通知履歴タブ */}
                  <TabPanel p={3}>
                    {isLoadingNotifications ? (
                      <Flex justify='center' align='center' py={4}>
                        <Spinner size='md' />
                      </Flex>
                    ) : notifications && notifications.length > 0 ? (
                      <VStack align='stretch' spacing={3}>
                        {notifications.map((notification) => {
                          // 通知内容をパース
                          let content = {};
                          try {
                            content = JSON.parse(notification.content);
                          } catch (e) {
                            console.error('通知内容のパースに失敗:', e);
                          }

                          return (
                            <Box
                              key={notification.id}
                              p={3}
                              borderRadius='md'
                              bg='gray.50'
                              borderLeft='4px solid'
                              borderLeftColor={notification.success ? 'green.400' : 'red.400'}
                            >
                              <Flex justifyContent='space-between' mb={1}>
                                <HStack>
                                  <Badge colorScheme={notification.type === 'STATUS_UPDATE' ? 'blue' : 'teal'}>
                                    {notification.type === 'STATUS_UPDATE' ? (
                                      <>
                                        <RepeatIcon mr={1} /> ステータス通知
                                      </>
                                    ) : notification.type === 'SHIPPING_UPDATE' ? (
                                      <>
                                        <BellIcon mr={1} /> 発送通知
                                      </>
                                    ) : (
                                      notification.type
                                    )}
                                  </Badge>
                                  <Badge colorScheme={notification.success ? 'green' : 'red'}>
                                    {notification.success ? '送信成功' : '送信失敗'}
                                  </Badge>
                                </HStack>
                                <Text fontSize='xs' color='gray.500'>
                                  <TimeIcon mr={1} />
                                  {formatDate(new Date(notification.sentAt))}
                                </Text>
                              </Flex>

                              {content && (content as any).message && <Text mt={2}>{(content as any).message}</Text>}

                              {notification.errorMessage && (
                                <Alert status='error' size='sm' mt={2} p={2}>
                                  <AlertIcon />
                                  <Text fontSize='xs'>{notification.errorMessage}</Text>
                                </Alert>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>
                    ) : (
                      <Box textAlign='center' py={4}>
                        <Text color='gray.500'>通知履歴がありません</Text>
                        <Button
                          leftIcon={<RepeatIcon />}
                          colorScheme='blue'
                          variant='outline'
                          size='sm'
                          mt={3}
                          onClick={() => refetchNotifications()}
                        >
                          更新
                        </Button>
                      </Box>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </Box>
      </SimpleGrid>

      {/* ステータス変更モーダル */}
      <Modal isOpen={isStatusModalOpen} onClose={onStatusModalClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleUpdateStatus}>
            <ModalHeader>注文ステータスの変更</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4}>
                <FormLabel>ステータス</FormLabel>
                <Select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  required
                >
                  <option value='pending'>処理待ち</option>
                  <option value='paid'>支払完了</option>
                  <option value='processing'>処理中</option>
                  <option value='printing'>印刷中</option>
                  <option value='shipped'>発送完了</option>
                  <option value='delivered'>配達完了</option>
                  <option value='cancelled'>キャンセル</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>管理者メモ</FormLabel>
                <Textarea
                  value={statusForm.adminMemo}
                  onChange={(e) => setStatusForm({ ...statusForm, adminMemo: e.target.value })}
                  placeholder='管理用のメモを入力してください'
                  rows={4}
                />
              </FormControl>

              <FormControl mt={4} display='flex' alignItems='center'>
                <FormLabel htmlFor='notify-customer' mb='0'>
                  顧客に通知する
                </FormLabel>
                <Switch
                  id='notify-customer'
                  isChecked={statusForm.notifyCustomer}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      notifyCustomer: e.target.checked
                    })
                  }
                  colorScheme='blue'
                />
                <Tooltip label='LINEで顧客にステータス変更を通知します' ml={2}>
                  <InfoIcon color='gray.500' />
                </Tooltip>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant='ghost' mr={3} onClick={onStatusModalClose}>
                キャンセル
              </Button>
              <Button
                colorScheme='blue'
                type='submit'
                leftIcon={<CheckIcon />}
                isLoading={updateStatusMutation.isPending}
              >
                更新
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* 配送情報更新モーダル */}
      <Modal isOpen={isShippingModalOpen} onClose={onShippingModalClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleUpdateShipping}>
            <ModalHeader>配送情報の更新</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4} isRequired>
                <FormLabel>配送業者</FormLabel>
                <Select
                  value={shippingForm.shippingCarrier}
                  onChange={(e) =>
                    setShippingForm({
                      ...shippingForm,
                      shippingCarrier: e.target.value
                    })
                  }
                  required
                >
                  <option value=''>選択してください</option>
                  <option value='yamato'>ヤマト運輸</option>
                  <option value='sagawa'>佐川急便</option>
                  <option value='japan_post'>日本郵便</option>
                </Select>
              </FormControl>

              <FormControl mb={4} isRequired>
                <FormLabel>追跡番号</FormLabel>
                <Input
                  value={shippingForm.trackingNumber}
                  onChange={(e) =>
                    setShippingForm({
                      ...shippingForm,
                      trackingNumber: e.target.value
                    })
                  }
                  placeholder='追跡番号を入力'
                  required
                />
              </FormControl>

              <FormControl mb={4} isRequired>
                <FormLabel>発送日</FormLabel>
                <Input
                  type='date'
                  value={shippingForm.shippedAt}
                  onChange={(e) =>
                    setShippingForm({
                      ...shippingForm,
                      shippedAt: e.target.value
                    })
                  }
                  required
                />
              </FormControl>

              <FormControl>
                <FormLabel>お届け予定日（任意）</FormLabel>
                <Input
                  type='date'
                  value={shippingForm.estimatedDeliveryAt}
                  onChange={(e) =>
                    setShippingForm({
                      ...shippingForm,
                      estimatedDeliveryAt: e.target.value
                    })
                  }
                />
              </FormControl>

              <FormControl mt={4} display='flex' alignItems='center'>
                <FormLabel htmlFor='notify-shipping' mb='0'>
                  顧客に配送情報を通知する
                </FormLabel>
                <Switch
                  id='notify-shipping'
                  isChecked={shippingForm.notifyCustomer}
                  onChange={(e) =>
                    setShippingForm({
                      ...shippingForm,
                      notifyCustomer: e.target.checked
                    })
                  }
                  colorScheme='teal'
                />
                <Tooltip label='LINEで顧客に配送情報を通知します' ml={2}>
                  <InfoIcon color='gray.500' />
                </Tooltip>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant='ghost' mr={3} onClick={onShippingModalClose}>
                キャンセル
              </Button>
              <Button
                colorScheme='teal'
                type='submit'
                leftIcon={<CheckIcon />}
                isLoading={updateShippingMutation.isPending}
              >
                更新
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

const ProductImage: React.FC<{ imageId: number; altText: string }> = ({ imageId, altText }) => {
  const { url, isLoading, error } = useImageSignedUrl(imageId);

  if (isLoading) {
    return (
      <Flex justify='center' align='center' h='200px'>
        <Spinner size='xl' />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box
        bg='gray.100'
        height='200px'
        borderRadius='md'
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        p={4}
      >
        <WarningIcon boxSize='40px' color='orange.400' mb={3} />
        <Text color='red.500' textAlign='center'>
          {error}
        </Text>
      </Box>
    );
  }

  if (!url) {
    return (
      <Box bg='gray.100' height='200px' borderRadius='md' display='flex' alignItems='center' justifyContent='center'>
        <Text color='gray.500'>画像URLが取得できません</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Image
        src={url}
        alt={altText}
        borderRadius='md'
        w='100%'
        h='200px'
        fit={'contain'}
        fallback={
          <Flex justify='center' align='center' h='200px'>
            <Spinner size='xl' />
          </Flex>
        }
      />
    </Box>
  );
};
