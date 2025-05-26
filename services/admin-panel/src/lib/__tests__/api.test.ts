import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { api } from '../api'

// axiosをモック化
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// configをモック化
vi.mock('../../config', () => ({
  config: {
    apiUrl: 'http://localhost:3000',
    appName: 'Test App',
    description: 'Test Description',
    appVersion: '1.0.0',
  },
}))

describe('API', () => {
  let mockCreate: any
  let mockRequest: any
  let mockResponse: any

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

    // window.locationのモック化
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
      },
      writable: true,
    })

    mockRequest = {
      use: vi.fn(),
    }
    mockResponse = {
      use: vi.fn(),
    }

    mockCreate = vi.fn(() => ({
      interceptors: {
        request: mockRequest,
        response: mockResponse,
      },
    }))

    mockedAxios.create = mockCreate
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初期化', () => {
    it('正しいbaseURLとheadersでaxios instanceを作成すること', () => {
      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('request interceptorが設定されること', () => {
      expect(mockRequest.use).toHaveBeenCalled()
    })

    it('response interceptorが設定されること', () => {
      expect(mockResponse.use).toHaveBeenCalled()
    })
  })

  describe('Request Interceptor', () => {
    let requestInterceptor: any

    beforeEach(() => {
      // request interceptorの関数を取得
      requestInterceptor = mockRequest.use.mock.calls[0][0]
    })

    it('トークンが存在する場合、Authorizationヘッダーを追加すること', () => {
      const token = 'test-token'
      vi.mocked(localStorage.getItem).mockReturnValue(token)

      const config = {
        headers: {},
      }

      const result = requestInterceptor(config)

      expect(localStorage.getItem).toHaveBeenCalledWith('auth_token')
      expect(result.headers.Authorization).toBe(`Bearer ${token}`)
    })

    it('トークンが存在しない場合、Authorizationヘッダーを追加しないこと', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)

      const config = {
        headers: {},
      }

      const result = requestInterceptor(config)

      expect(localStorage.getItem).toHaveBeenCalledWith('auth_token')
      expect(result.headers.Authorization).toBeUndefined()
    })
  })

  describe('Response Interceptor', () => {
    let responseSuccessInterceptor: any
    let responseErrorInterceptor: any

    beforeEach(() => {
      // response interceptorの関数を取得
      const responseInterceptorCalls = mockResponse.use.mock.calls[0]
      responseSuccessInterceptor = responseInterceptorCalls[0]
      responseErrorInterceptor = responseInterceptorCalls[1]
    })

    it('正常なレスポンスをそのまま返すこと', () => {
      const response = { data: 'test data', status: 200 }
      const result = responseSuccessInterceptor(response)
      expect(result).toBe(response)
    })

    it('401エラーの場合、トークンを削除してログインページにリダイレクトすること', async () => {
      const error = {
        response: {
          status: 401,
        },
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(window.location.href).toBe('/login')
    })

    it('401以外のエラーの場合、リダイレクトしないこと', async () => {
      const error = {
        response: {
          status: 500,
        },
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(localStorage.removeItem).not.toHaveBeenCalled()
      expect(window.location.href).toBe('')
    })

    it('responseが存在しないエラーの場合、リダイレクトしないこと', async () => {
      const error = {
        message: 'Network Error',
      }

      await expect(responseErrorInterceptor(error)).rejects.toBe(error)
      expect(localStorage.removeItem).not.toHaveBeenCalled()
      expect(window.location.href).toBe('')
    })
  })
})
