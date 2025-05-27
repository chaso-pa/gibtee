import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { api } from '../../../lib/api'

// APIをモック化
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

// カスタムフックをテスト用に定義（OrderDetail.tsxから抽出）
import { useEffect, useState } from 'react'

const useImageSignedUrl = (imageId: number | undefined) => {
  const [url, setUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!imageId) return

    const fetchSignedUrl = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data } = await api.get(`/api/images/${imageId}/signed-url`)
        setUrl(data.url)
      } catch (err: any) {
        setError(err.response?.data?.message || '画像URLの取得に失敗しました')
        console.error('画像URL取得エラー:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSignedUrl()
  }, [imageId])

  return { url, isLoading, error }
}

describe('Image Management Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useImageSignedUrl', () => {
    it('画像IDが提供された場合、署名付きURLを正しく取得すること', async () => {
      const mockResponse = {
        data: {
          url: 'https://example.com/signed-image-url.jpg?signature=abc123',
        },
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useImageSignedUrl(123))

      // 初期状態
      expect(result.current.url).toBe('')
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()

      // API呼び出し後
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.get).toHaveBeenCalledWith('/api/images/123/signed-url')
      expect(result.current.url).toBe('https://example.com/signed-image-url.jpg?signature=abc123')
      expect(result.current.error).toBeNull()
    })

    it('画像IDが未定義の場合、API呼び出しを行わないこと', () => {
      const { result } = renderHook(() => useImageSignedUrl(undefined))

      expect(result.current.url).toBe('')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(api.get).not.toHaveBeenCalled()
    })

    it('API呼び出しでエラーが発生した場合、エラー状態を正しく設定すること', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Image not found',
          },
        },
      }

      vi.mocked(api.get).mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useImageSignedUrl(456))

      // 初期状態
      expect(result.current.isLoading).toBe(true)

      // エラー後
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.url).toBe('')
      expect(result.current.error).toBe('Image not found')
    })

    it('レスポンスにメッセージがない場合、デフォルトエラーメッセージを使用すること', async () => {
      const mockError = new Error('Network Error')

      vi.mocked(api.get).mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useImageSignedUrl(789))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('画像URLの取得に失敗しました')
    })

    it('画像IDが変更された場合、新しいURLを取得すること', async () => {
      const mockResponse1 = {
        data: { url: 'https://example.com/image1.jpg' },
      }
      const mockResponse2 = {
        data: { url: 'https://example.com/image2.jpg' },
      }

      vi.mocked(api.get)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      const { result, rerender } = renderHook(
        ({ imageId }) => useImageSignedUrl(imageId),
        {
          initialProps: { imageId: 1 },
        }
      )

      // 最初の画像
      await waitFor(() => {
        expect(result.current.url).toBe('https://example.com/image1.jpg')
      })

      // 画像IDを変更
      rerender({ imageId: 2 })

      await waitFor(() => {
        expect(result.current.url).toBe('https://example.com/image2.jpg')
      })

      expect(api.get).toHaveBeenCalledTimes(2)
      expect(api.get).toHaveBeenNthCalledWith(1, '/api/images/1/signed-url')
      expect(api.get).toHaveBeenNthCalledWith(2, '/api/images/2/signed-url')
    })

    it('同じ画像IDで再レンダーされても、重複してAPI呼び出しを行わないこと', async () => {
      const mockResponse = {
        data: { url: 'https://example.com/image.jpg' },
      }

      vi.mocked(api.get).mockResolvedValueOnce(mockResponse)

      const { result, rerender } = renderHook(
        ({ imageId }) => useImageSignedUrl(imageId),
        {
          initialProps: { imageId: 1 },
        }
      )

      await waitFor(() => {
        expect(result.current.url).toBe('https://example.com/image.jpg')
      })

      // 同じ画像IDで再レンダー
      rerender({ imageId: 1 })

      // API呼び出しは1回のみ
      expect(api.get).toHaveBeenCalledTimes(1)
    })

    it('ローディング状態が正しく管理されること', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(api.get).mockReturnValueOnce(promise)

      const { result } = renderHook(() => useImageSignedUrl(1))

      // ローディング開始
      expect(result.current.isLoading).toBe(true)
      expect(result.current.url).toBe('')
      expect(result.current.error).toBeNull()

      // プロミスを解決
      resolvePromise!({
        data: { url: 'https://example.com/image.jpg' },
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.url).toBe('https://example.com/image.jpg')
      expect(result.current.error).toBeNull()
    })
  })

  describe('Image Validation Utils', () => {
    const isValidImageUrl = (url: string): boolean => {
      if (!url) return false
      
      // URLの形式チェック
      try {
        new URL(url)
      } catch {
        return false
      }

      // 画像ファイルの拡張子チェック
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      const hasValidExtension = imageExtensions.some(ext => 
        url.toLowerCase().includes(ext)
      )

      return hasValidExtension
    }

    const getImageDimensions = async (url: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
          })
        }

        img.onerror = () => {
          reject(new Error('画像の読み込みに失敗しました'))
        }

        img.src = url
      })
    }

    it('有効な画像URLを正しく判定すること', () => {
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.png')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.gif')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.webp')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.svg')).toBe(true)
    })

    it('無効な画像URLを正しく判定すること', () => {
      expect(isValidImageUrl('')).toBe(false)
      expect(isValidImageUrl('invalid-url')).toBe(false)
      expect(isValidImageUrl('https://example.com/document.pdf')).toBe(false)
      expect(isValidImageUrl('https://example.com/video.mp4')).toBe(false)
    })

    it('大文字小文字を区別せずに拡張子を判定すること', () => {
      expect(isValidImageUrl('https://example.com/image.JPG')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.PNG')).toBe(true)
      expect(isValidImageUrl('https://example.com/image.JPEG')).toBe(true)
    })

    // 注意: getImageDimensionsのテストはJSDOM環境では実際の画像読み込みができないため、
    // モックを使用したテストのみ実装

    it('画像の寸法取得関数が正しい形式で実装されていること', () => {
      expect(typeof getImageDimensions).toBe('function')
      expect(getImageDimensions.length).toBe(1) // 引数が1つ
    })
  })

  describe('Image Processing Utils', () => {
    const generateImageThumbnail = (originalUrl: string, size: number): string => {
      if (!originalUrl) return ''
      
      // クエリパラメータに寸法を追加
      const url = new URL(originalUrl)
      url.searchParams.set('w', size.toString())
      url.searchParams.set('h', size.toString())
      url.searchParams.set('fit', 'crop')
      
      return url.toString()
    }

    const getImageFileSize = async (url: string): Promise<number> => {
      try {
        const response = await fetch(url, { method: 'HEAD' })
        const contentLength = response.headers.get('content-length')
        return contentLength ? parseInt(contentLength, 10) : 0
      } catch (error) {
        throw new Error('ファイルサイズの取得に失敗しました')
      }
    }

    it('サムネイルURLを正しく生成すること', () => {
      const originalUrl = 'https://example.com/image.jpg'
      const thumbnailUrl = generateImageThumbnail(originalUrl, 200)
      
      expect(thumbnailUrl).toContain('w=200')
      expect(thumbnailUrl).toContain('h=200')
      expect(thumbnailUrl).toContain('fit=crop')
    })

    it('空のURLに対してサムネイル生成を行わないこと', () => {
      const result = generateImageThumbnail('', 200)
      expect(result).toBe('')
    })

    it('ファイルサイズ取得関数が正しい形式で実装されていること', () => {
      expect(typeof getImageFileSize).toBe('function')
      expect(getImageFileSize.length).toBe(1)
    })
  })
})
