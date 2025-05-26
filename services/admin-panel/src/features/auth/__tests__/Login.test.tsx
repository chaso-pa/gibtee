import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { Login } from '../Login'
import { api } from '../../../lib/api'

// APIをモック化
vi.mock('../../../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

// configをモック化
vi.mock('../../../config', () => ({
  config: {
    appName: 'Test App',
  },
}))

// react-router-domのフックをモック化
const mockNavigate = vi.fn()
const mockLocation = {
  state: null,
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </ChakraProvider>
)

describe('Login', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // localStorageのモック化
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    })

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('レンダリング', () => {
    it('ログインフォームが正しく表示されること', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      expect(screen.getByText('Test App')).toBeInTheDocument()
      expect(screen.getByText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByText('パスワード')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
    })

    it('プレースホルダーが正しく表示されること', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      expect(screen.getByPlaceholderText('メールアドレスを入力')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('パスワードを入力')).toBeInTheDocument()
    })
  })

  describe('バリデーション', () => {
    it('空のメールアドレスでエラーメッセージが表示されること', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: 'ログイン' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument()
      })
    })

    it('空のパスワードでエラーメッセージが表示されること', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('メールアドレスを入力')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'ログイン' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('パスワードは必須です')).toBeInTheDocument()
      })
    })

    it('有効な入力値でバリデーションエラーが表示されないこと', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('メールアドレスを入力')
      const passwordInput = screen.getByPlaceholderText('パスワードを入力')

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'ログイン' })
      await user.click(submitButton)

      expect(screen.queryByText('メールアドレスは必須です')).not.toBeInTheDocument()
      expect(screen.queryByText('パスワードは必須です')).not.toBeInTheDocument()
    })
  })

  describe('ログイン処理', () => {
    it('成功時にトークンを保存してリダイレクトすること', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: 1, email: 'test@example.com' },
        },
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('メールアドレスを入力')
      const passwordInput = screen.getByPlaceholderText('パスワードを入力')
      const submitButton = screen.getByRole('button', { name: 'ログイン' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({ id: 1, email: 'test@example.com' })
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'ログイン成功',
        description: '管理画面へようこそ',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })

    it('失敗時にエラーメッセージが表示されること', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      }

      vi.mocked(api.post).mockRejectedValueOnce(mockError)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('メールアドレスを入力')
      const passwordInput = screen.getByPlaceholderText('パスワードを入力')
      const submitButton = screen.getByRole('button', { name: 'ログイン' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrong-password')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('ネットワークエラー時にデフォルトメッセージが表示されること', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'))

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('メールアドレスを入力')
      const passwordInput = screen.getByPlaceholderText('パスワードを入力')
      const submitButton = screen.getByRole('button', { name: 'ログイン' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('ログインに失敗しました。認証情報をご確認ください。')
        ).toBeInTheDocument()
      })
    })

    it('ローディング状態が正しく表示されること', async () => {
      // APIレスポンスを遅らせる
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.mocked(api.post).mockReturnValueOnce(promise)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('メールアドレスを入力')
      const passwordInput = screen.getByPlaceholderText('パスワードを入力')
      const submitButton = screen.getByRole('button', { name: 'ログイン' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // ローディング状態を確認
      expect(screen.getByText('ログイン中...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      // プロミスを解決してローディング状態を終了
      resolvePromise!({
        data: {
          token: 'test-token',
          user: { id: 1, email: 'test@example.com' },
        },
      })

      await waitFor(() => {
        expect(screen.queryByText('ログイン中...')).not.toBeInTheDocument()
      })
    })
  })

  describe('リダイレクト', () => {
    it('fromパラメータが指定されている場合、指定されたページにリダイレクトすること', async () => {
      mockLocation.state = {
        from: {
          pathname: '/orders',
        },
      }

      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: 1, email: 'test@example.com' },
        },
      }

      vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      )

      const emailInput = screen.getByPlaceholderText('メールアドレスを入力')
      const passwordInput = screen.getByPlaceholderText('パスワードを入力')
      const submitButton = screen.getByRole('button', { name: 'ログイン' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/orders', { replace: true })
      })
    })
  })
})
