import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrderList } from '../OrderList'
import { api } from '../../../lib/api'

// APIをモック化
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

// ユーティリティ関数をモック化
vi.mock('../../../utils/date', () => ({
  formatDate: (date: Date) => date.toLocaleDateString(),
}))

vi.mock('../../../utils/format', () => ({
  formatPrice: (price: number) => `¥${price.toLocaleString()}`,
}))

// 共通コンポーネントをモック化
vi.mock('../../../components/common/OrderStatusBadge', () => ({
  OrderStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}))

// react-router-domのフックをモック化
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// ChakraUIのtoastをモック化
const mockToast = vi.fn()
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => mockToast,
  }
})

const mockOrdersResponse = {
  orders: [
    {
      id: 1,
      orderNumber: 'ORD-001',
      status: 'pending',
      recipientName: '田中太郎',
      user: { displayName: '田中太郎' },
      shirtSize: 'M',
      shirtColor: 'white',
      price: '3000',
      createdAt: '2024-01-01T00:00:00Z',
      isHighPriority: false,
      hasPrintingIssue: false,
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      status: 'paid',
      recipientName: '佐藤花子',
      user: { displayName: '佐藤花子' },
      shirtSize: 'L',
      shirtColor: 'black',
      price: '3500',
      createdAt: '2024-01-02T00:00:00Z',
      isHighPriority: true,
      hasPrintingIssue: false,
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
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

describe('OrderList', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockResolvedValue({ data: mockOrdersResponse })
  })

  describe('レンダリング', () => {
    it('注文一覧コンポーネントが正しく表示されること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      expect(screen.getByText('注文一覧')).toBeInTheDocument()
      expect(screen.getByText('ステータス')).toBeInTheDocument()
      expect(screen.getByText('サイズ')).toBeInTheDocument()
      expect(screen.getByText('カラー')).toBeInTheDocument()
      expect(screen.getByText('検索')).toBeInTheDocument()
    })

    it('注文データが正しく表示されること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument()
        expect(screen.getByText('ORD-002')).toBeInTheDocument()
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
        expect(screen.getByText('佐藤花子')).toBeInTheDocument()
        expect(screen.getByText('¥3,000')).toBeInTheDocument()
        expect(screen.getByText('¥3,500')).toBeInTheDocument()
      })
    })

    it('ローディング状態が正しく表示されること', () => {
      // APIレスポンスを遅らせる
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(api.get).mockReturnValueOnce(promise)

      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      expect(screen.getByTestId('chakra-spinner')).toBeInTheDocument()

      // プロミスを解決
      resolvePromise!({ data: mockOrdersResponse })
    })

    it('注文がない場合、適切なメッセージが表示されること', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          orders: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      })

      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('該当する注文がありません')).toBeInTheDocument()
      })
    })
  })

  describe('フィルタリング機能', () => {
    it('ステータスフィルタが正しく動作すること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      const statusSelect = screen.getByDisplayValue('')
      await user.selectOptions(statusSelect, 'paid')

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('status=paid')
        )
      })
    })

    it('サイズフィルタが正しく動作すること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      const sizeSelect = screen.getAllByDisplayValue('')[1] // 2番目の空のselect要素（サイズ）
      await user.selectOptions(sizeSelect, 'L')

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('shirtSize=L')
        )
      })
    })

    it('検索機能が正しく動作すること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      const searchInput = screen.getByPlaceholderText('注文番号、氏名、電話番号など')
      const searchButton = screen.getByRole('button', { name: '検索' })

      await user.type(searchInput, 'ORD-001')
      await user.click(searchButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          expect.stringContaining('search=ORD-001')
        )
      })
    })

    it('リセットボタンが正しく動作すること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      // フィルタを設定
      const statusSelect = screen.getByDisplayValue('')
      await user.selectOptions(statusSelect, 'paid')

      // リセットボタンをクリック
      const resetButton = screen.getByRole('button', { name: 'リセット' })
      await user.click(resetButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenLastCalledWith(
          expect.not.stringContaining('status=paid')
        )
      })
    })
  })

  describe('ページネーション', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          ...mockOrdersResponse,
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
        },
      })
    })

    it('ページネーション情報が正しく表示されること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('全 25 件中 1 - 10 件表示')).toBeInTheDocument()
        expect(screen.getByText('1 / 3')).toBeInTheDocument()
      })
    })

    it('次のページボタンが正しく動作すること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        const nextButton = screen.getByLabelText('次のページ')
        expect(nextButton).not.toBeDisabled()
      })

      const nextButton = screen.getByLabelText('次のページ')
      await user.click(nextButton)

      await waitFor(() => {
        expect(api.get).toHaveBeenLastCalledWith(
          expect.stringContaining('page=2')
        )
      })
    })

    it('前のページボタンが最初のページで無効になること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        const prevButton = screen.getByLabelText('前のページ')
        expect(prevButton).toBeDisabled()
      })
    })
  })

  describe('注文詳細遷移', () => {
    it('詳細ボタンクリックで正しいページに遷移すること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        const detailButtons = screen.getAllByText('詳細')
        expect(detailButtons).toHaveLength(2)
      })

      const firstDetailButton = screen.getAllByText('詳細')[0]
      await user.click(firstDetailButton)

      expect(mockNavigate).toHaveBeenCalledWith('/orders/1')
    })
  })

  describe('エラーハンドリング', () => {
    it('APIエラー時にエラーメッセージが表示されること', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'))

      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('注文データの取得中にエラーが発生しました。')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
      })
    })

    it('再試行ボタンが正しく動作すること', async () => {
      vi.mocked(api.get)
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: mockOrdersResponse })

      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: '再試行' })
        expect(retryButton).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: '再試行' })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument()
      })
    })
  })

  describe('優先度・印刷問題バッジ', () => {
    it('優先度バッジが正しく表示されること', async () => {
      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        const priorityBadges = screen.getAllByText('優先')
        expect(priorityBadges).toHaveLength(1) // 2番目の注文のみ優先
      })
    })

    it('印刷問題バッジが条件に応じて表示されること', async () => {
      const ordersWithPrintingIssue = {
        ...mockOrdersResponse,
        orders: [
          {
            ...mockOrdersResponse.orders[0],
            hasPrintingIssue: true,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValueOnce({
        data: ordersWithPrintingIssue,
      })

      render(
        <TestWrapper>
          <OrderList />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('印刷')).toBeInTheDocument()
      })
    })
  })
})
