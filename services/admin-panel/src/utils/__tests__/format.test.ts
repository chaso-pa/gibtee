import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  formatNumber,
  formatTrackingNumber,
  formatPhoneNumber,
  formatPostalCode,
} from '../format'

describe('Format Utils', () => {
  describe('formatPrice', () => {
    it('整数価格を正しい日本円形式でフォーマットすること', () => {
      const result = formatPrice(1000)
      expect(result).toBe('¥1,000')
    })

    it('小数点以下がある場合も適切にフォーマットすること', () => {
      const result = formatPrice(1500.5)
      expect(result).toBe('¥1,501') // 小数点以下は切り捨て/四捨五入
    })

    it('0円を正しくフォーマットすること', () => {
      const result = formatPrice(0)
      expect(result).toBe('¥0')
    })

    it('大きな金額を正しくフォーマットすること', () => {
      const result = formatPrice(1234567)
      expect(result).toBe('¥1,234,567')
    })

    it('負の金額も正しくフォーマットすること', () => {
      const result = formatPrice(-1000)
      expect(result).toBe('-¥1,000')
    })
  })

  describe('formatNumber', () => {
    it('整数をカンマ区切りでフォーマットすること', () => {
      const result = formatNumber(1234567)
      expect(result).toBe('1,234,567')
    })

    it('小さな数値もフォーマットできること', () => {
      const result = formatNumber(123)
      expect(result).toBe('123')
    })

    it('0をフォーマットできること', () => {
      const result = formatNumber(0)
      expect(result).toBe('0')
    })

    it('負の数値もフォーマットできること', () => {
      const result = formatNumber(-12345)
      expect(result).toBe('-12,345')
    })

    it('小数点以下がある数値もフォーマットできること', () => {
      const result = formatNumber(1234.567)
      expect(result).toBe('1,234.567')
    })
  })

  describe('formatTrackingNumber', () => {
    it('追跡番号がない場合「未設定」を返すこと', () => {
      const result = formatTrackingNumber(null, 'yamato')
      expect(result).toBe('未設定')

      const result2 = formatTrackingNumber(undefined, 'yamato')
      expect(result2).toBe('未設定')

      const result3 = formatTrackingNumber('', 'yamato')
      expect(result3).toBe('未設定')
    })

    it('ヤマト運輸の追跡番号を正しくフォーマットすること', () => {
      const result = formatTrackingNumber('123456789012', 'yamato')
      expect(result).toBe('1234-5678-9012')

      const result2 = formatTrackingNumber('123456789012', 'ヤマト運輸')
      expect(result2).toBe('1234-5678-9012')
    })

    it('佐川急便の追跡番号はそのまま返すこと', () => {
      const result = formatTrackingNumber('123456789012', 'sagawa')
      expect(result).toBe('123456789012')

      const result2 = formatTrackingNumber('123456789012', '佐川急便')
      expect(result2).toBe('123456789012')
    })

    it('日本郵便の12桁追跡番号を正しくフォーマットすること', () => {
      const result = formatTrackingNumber('123456789012', 'japan_post')
      expect(result).toBe('1234-5678-9012')

      const result2 = formatTrackingNumber('123456789012', '日本郵便')
      expect(result2).toBe('1234-5678-9012')

      const result3 = formatTrackingNumber('123456789012', 'ゆうパック')
      expect(result3).toBe('1234-5678-9012')
    })

    it('日本郵便の12桁以外の追跡番号はそのまま返すこと', () => {
      const result = formatTrackingNumber('12345678901', 'japan_post')
      expect(result).toBe('12345678901')

      const result2 = formatTrackingNumber('1234567890123', 'japan_post')
      expect(result2).toBe('1234567890123')
    })

    it('不明な配送業者の場合はそのまま返すこと', () => {
      const result = formatTrackingNumber('123456789012', 'unknown_carrier')
      expect(result).toBe('123456789012')
    })

    it('配送業者がnullの場合はそのまま返すこと', () => {
      const result = formatTrackingNumber('123456789012', null)
      expect(result).toBe('123456789012')
    })

    it('大文字小文字を区別しないこと', () => {
      const result = formatTrackingNumber('123456789012', 'YAMATO')
      expect(result).toBe('1234-5678-9012')
    })
  })

  describe('formatPhoneNumber', () => {
    it('電話番号がない場合空文字を返すこと', () => {
      const result = formatPhoneNumber(null)
      expect(result).toBe('')

      const result2 = formatPhoneNumber(undefined)
      expect(result2).toBe('')

      const result3 = formatPhoneNumber('')
      expect(result3).toBe('')
    })

    it('携帯電話番号（11桁）を正しくフォーマットすること', () => {
      const result = formatPhoneNumber('09012345678')
      expect(result).toBe('090-1234-5678')

      const result2 = formatPhoneNumber('08012345678')
      expect(result2).toBe('080-1234-5678')

      const result3 = formatPhoneNumber('07012345678')
      expect(result3).toBe('070-1234-5678')
    })

    it('固定電話番号（10桁）を正しくフォーマットすること', () => {
      const result = formatPhoneNumber('0312345678')
      expect(result).toBe('03-1234-5678')

      const result2 = formatPhoneNumber('0671234567')
      expect(result2).toBe('067-123-4567')
    })

    it('既にハイフンが含まれている電話番号も正しく処理すること', () => {
      const result = formatPhoneNumber('090-1234-5678')
      expect(result).toBe('090-1234-5678')

      const result2 = formatPhoneNumber('03-1234-5678')
      expect(result2).toBe('03-1234-5678')
    })

    it('不正な形式の電話番号はそのまま返すこと', () => {
      const result = formatPhoneNumber('12345')
      expect(result).toBe('12345')

      const result2 = formatPhoneNumber('090123456789')
      expect(result2).toBe('090123456789')
    })

    it('数字以外の文字が含まれている場合は除去してフォーマットすること', () => {
      const result = formatPhoneNumber('090(1234)5678')
      expect(result).toBe('090-1234-5678')

      const result2 = formatPhoneNumber('090 1234 5678')
      expect(result2).toBe('090-1234-5678')
    })
  })

  describe('formatPostalCode', () => {
    it('郵便番号がない場合空文字を返すこと', () => {
      const result = formatPostalCode(null)
      expect(result).toBe('')

      const result2 = formatPostalCode(undefined)
      expect(result2).toBe('')

      const result3 = formatPostalCode('')
      expect(result3).toBe('')
    })

    it('7桁の郵便番号を正しくフォーマットすること', () => {
      const result = formatPostalCode('1234567')
      expect(result).toBe('123-4567')
    })

    it('既にハイフンが含まれている郵便番号も正しく処理すること', () => {
      const result = formatPostalCode('123-4567')
      expect(result).toBe('123-4567')
    })

    it('数字以外の文字が含まれている場合は除去してフォーマットすること', () => {
      const result = formatPostalCode('123 4567')
      expect(result).toBe('123-4567')

      const result2 = formatPostalCode('〒123-4567')
      expect(result2).toBe('123-4567')
    })

    it('7桁以外の郵便番号はそのまま返すこと', () => {
      const result = formatPostalCode('12345')
      expect(result).toBe('12345')

      const result2 = formatPostalCode('12345678')
      expect(result2).toBe('12345678')
    })
  })

  describe('エッジケース', () => {
    it('formatPrice with NaN', () => {
      const result = formatPrice(NaN)
      expect(result).toBe('¥NaN')
    })

    it('formatNumber with Infinity', () => {
      const result = formatNumber(Infinity)
      expect(result).toBe('∞')
    })

    it('formatPhoneNumber with only numbers', () => {
      const result = formatPhoneNumber('1234567890')
      expect(result).toBe('123-456-7890')
    })

    it('formatPostalCode with mixed characters', () => {
      const result = formatPostalCode('abc1234567def')
      expect(result).toBe('123-4567')
    })
  })
})
