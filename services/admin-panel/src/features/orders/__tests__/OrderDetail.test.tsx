import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrderDetail } from '../OrderDetail'
import { api } from '../../../lib/api'

// APIをモック化
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

// ルーターをモック化
const mockNavigate = vi.fn()
const mockParams = { orderId: '1' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

// ユーティリティ関数をモック化
vi.mock('../../../utils/date', () => ({
  formatDate: (date: Date) => date.toLocaleDateString(),
  timeAgo: (date: Date) => '1時間前',
}))

vi.mock('../../../utils/format', () => ({
  formatPrice: (price: number) => `¥${price.toLocaleString()}`,
  formatPhoneNumber: (phone: string) => phone,
  formatPostalCode: (code: string) => code,
  formatTrackingNumber: (number: string) => number,
}))

// 共通コンポーネントをモック化
vi.mock('../../../components/common/OrderStatusBadge', () => ({
  OrderStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}))

// ChakraUIのtoastをモック化
const mockToast = vi.fn()
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => mockToast,
  }
})

const mockOrderData = {
  id: 1,
  orderNumber: 'ORD-001',
  status: 'paid',
  createdAt: '2024-01-01T00:00:00Z',
  shirtSize: 'M',
  shirtColor: 'white',
  quantity: 1,
  price: '3000',
  isHighPriority: false,
  hasPrintingIssue: false,
  adminMemo: 'テストメモ',
  user: {
    displayName: '田中太郎',
    lineUserId: 'test-line-id',
    profileImageUrl: 'https://example.com/profile.jpg',
  },
  recipientName: '田中太郎',
  postalCode: '123-4567',
  prefecture: '東京都',
  city: '渋谷区',
  streetAddress: '神宮前1-1-1',
  buildingName: 'テストビル101',
  recipientPhone: '090-1234-5678',
  shippingCarrier: 'yamato',
  trackingNumber: '123456789012',
  shippedAt: '2024-01-02T00:00:00Z',
  estimatedDeliveryAt: '2024-01-03T00:00:00Z',
  notifiedShipping: true,
  image: {
    id: 1,
  },
  payments: [
    {
      id: 1,
      method: 'LINE_PAY',
      amount: 3000,
      status: 'COMPLETED',
      createdAt: '2024-01-01T10:00:00Z',
    },
  ],
  orderHistories: [
    {
      id: 1,
      status: 'paid',
      message: '支払いが完了しました',
      createdAt: '2024-01-01T10:00:00Z',
      createdBy: 'system',
    },
  ],
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <ChakraProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    </ChakraProvider>
  )
}

describe('OrderDetail', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // 注文詳細データのモック
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/orders/1') {
        return Promise.resolve({ data: { order: mockOrderData } })
      }
      if (url === '/api/orders/1/notifications') {
        return Promise.resolve({ data: { notifications: [] } })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  describe('レンダリング', () => {
    it('注文詳細が正しく表示されること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('注文詳細: ORD-001')).toBeInTheDocument()
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
        expect(screen.getByText('¥3,000')).toBeInTheDocument()
        expect(screen.getByText('M')).toBeInTheDocument()
        expect(screen.getByTestId('status-badge')).toBeInTheDocument()
      })
    })

    it('基本情報セクションが表示されること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('基本情報')).toBeInTheDocument()
        expect(screen.getByText('注文番号')).toBeInTheDocument()
        expect(screen.getByText('注文日時')).toBeInTheDocument()
        expect(screen.getByText('サイズ')).toBeInTheDocument()
        expect(screen.getByText('カラー')).toBeInTheDocument()
      })
    })

    it('顧客情報セクションが表示されること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('顧客情報')).toBeInTheDocument()
        expect(screen.getByText('配送先')).toBeInTheDocument()
        expect(screen.getByText('連絡先')).toBeInTheDocument()
      })
    })

    it('配送情報セクションが表示されること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('配送情報')).toBeInTheDocument()
        expect(screen.getByText('配送業者')).toBeInTheDocument()
        expect(screen.getByText('追跡番号')).toBeInTheDocument()
        expect(screen.getByText('発送日')).toBeInTheDocument()
      })
    })

    it('支払い情報セクションが表示されること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('支払い情報')).toBeInTheDocument()
        expect(screen.getByText('支払い方法')).toBeInTheDocument()
        expect(screen.getByText('金額')).toBeInTheDocument()
        expect(screen.getByText('ステータス')).toBeInTheDocument()
      })
    })

    it('履歴情報セクションが表示されること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('履歴情報')).toBeInTheDocument()
        expect(screen.getByText('注文履歴')).toBeInTheDocument()
      })
    })
  })

  describe('ローディング状態', () => {
    it('ローディング中はスピナーが表示されること', () => {
      // APIレスポンスを遅らせる
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(api.get).mockReturnValueOnce(promise)

      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      expect(screen.getByTestId('chakra-spinner')).toBeInTheDocument()

      // プロミスを解決
      resolvePromise!({ data: { order: mockOrderData } })
    })
  })

  describe('エラーハンドリング', () => {
    it('APIエラー時にエラーメッセージが表示されること', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'))

      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument()
        expect(screen.getByText('注文詳細の取得に失敗しました。')).toBeInTheDocument()
        expect(screen.getByText('注文一覧に戻る')).toBeInTheDocument()
      })
    })
  })

  describe('ナビゲーション', () => {
    it('戻るボタンで注文一覧に戻ること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        const backButton = screen.getByText('注文一覧に戻る')
        expect(backButton).toBeInTheDocument()
      })

      const backButton = screen.getByText('注文一覧に戻る')
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/orders')
    })
  })

  describe('ステータス更新', () => {
    it('ステータス変更ボタンでモーダルが開くこと', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        const statusButton = screen.getByText('ステータス変更')
        expect(statusButton).toBeInTheDocument()
      })

      const statusButton = screen.getByText('ステータス変更')
      await user.click(statusButton)

      await waitFor(() => {
        expect(screen.getByText('注文ステータスの変更')).toBeInTheDocument()
      })
    })

    it('ステータス更新が正常に動作すること', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: {} })

      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        const statusButton = screen.getByText('ステータス変更')
        expect(statusButton).toBeInTheDocument()
      })

      const statusButton = screen.getByText('ステータス変更')
      await user.click(statusButton)

      await waitFor(() => {
        const statusSelect = screen.getByDisplayValue('paid')
        expect(statusSelect).toBeInTheDocument()
      })

      const statusSelect = screen.getByDisplayValue('paid')
      await user.selectOptions(statusSelect, 'processing')

      const updateButton = screen.getByText('更新')
      await user.click(updateButton)

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/api/orders/1/status', {
          status: 'processing',
          adminMemo: 'テストメモ',
          notifyCustomer: true,
        })
      })
    })
  })

  describe('配送情報更新', () => {
    it('配送情報変更ボタンでモーダルが開くこと', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        const shippingButton = screen.getByText('配送情報変更')
        expect(shippingButton).toBeInTheDocument()
      })

      const shippingButton = screen.getByText('配送情報変更')
      await user.click(shippingButton)

      await waitFor(() => {
        expect(screen.getByText('配送情報の更新')).toBeInTheDocument()
      })
    })
  })

  describe('優先度・印刷問題バッジ', () => {
    it('優先度バッジが条件に応じて表示されること', async () => {
      const priorityOrderData = {
        ...mockOrderData,
        isHighPriority: true,
      }

      vi.mocked(api.get).mockResolvedValueOnce({
        data: { order: priorityOrderData },
      })

      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('優先出荷')).toBeInTheDocument()
      })
    })

    it('印刷問題バッジが条件に応じて表示されること', async () => {
      const printingIssueOrderData = {
        ...mockOrderData,
        hasPrintingIssue: true,
      }

      vi.mocked(api.get).mockResolvedValueOnce({
        data: { order: printingIssueOrderData },
      })

      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('印刷問題あり')).toBeInTheDocument()
      })
    })
  })

  describe('支払い情報表示', () => {
    it('支払い方法が正しく表示されること', async () => {
      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('LINE Pay')).toBeInTheDocument()
        expect(screen.getByText('完了')).toBeInTheDocument()
      })
    })

    it('支払い情報がない場合の表示', async () => {
      const noPaymentOrderData = {
        ...mockOrderData,
        payments: [],
      }

      vi.mocked(api.get).mockResolvedValueOnce({
        data: { order: noPaymentOrderData },
      })

      render(
        <TestWrapper>
          <OrderDetail />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('支払い情報がありません')).toBeInTheDocument()
      })
    })
  })
})
