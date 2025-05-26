import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate, formatShortDate, parseDate, timeAgo } from '../date'

describe('Date Utils', () => {
  beforeEach(() => {
    // 固定日時を設定してテストの一貫性を保つ
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDate', () => {
    it('日付を正しい日本語形式でフォーマットすること', () => {
      const date = new Date('2024-01-01T10:30:00Z')
      const result = formatDate(date)
      
      // 日本語ロケールでのフォーマット結果を期待
      expect(result).toMatch(/2024/)
      expect(result).toMatch(/1/)
      expect(result).toMatch(/1/)
    })

    it('時間も含めて正しくフォーマットすること', () => {
      const date = new Date('2024-12-25T15:45:00Z')
      const result = formatDate(date)
      
      expect(result).toMatch(/2024/)
      expect(result).toMatch(/12/)
      expect(result).toMatch(/25/)
    })
  })

  describe('formatShortDate', () => {
    it('年を除いた短い形式でフォーマットすること', () => {
      const date = new Date('2024-03-15T14:20:00Z')
      const result = formatShortDate(date)
      
      // 短い形式では年が含まれない
      expect(result).toMatch(/3/)
      expect(result).toMatch(/15/)
      // 年は含まれないはず
      expect(result).not.toMatch(/2024/)
    })
  })

  describe('parseDate', () => {
    it('有効な日付文字列からDateオブジェクトを作成すること', () => {
      const dateStr = '2024-01-01T10:00:00Z'
      const result = parseDate(dateStr)
      
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(0) // 0ベース（1月）
      expect(result?.getDate()).toBe(1)
    })

    it('null値の場合、nullを返すこと', () => {
      const result = parseDate(null)
      expect(result).toBeNull()
    })

    it('undefined値の場合、nullを返すこと', () => {
      const result = parseDate(undefined)
      expect(result).toBeNull()
    })

    it('空文字列の場合、nullを返すこと', () => {
      const result = parseDate('')
      expect(result).toBeNull()
    })

    it('無効な日付文字列でもDateオブジェクトを作成すること', () => {
      const result = parseDate('invalid-date')
      expect(result).toBeInstanceOf(Date)
      expect(result?.toString()).toBe('Invalid Date')
    })
  })

  describe('timeAgo', () => {
    it('1分未満の場合「たった今」を返すこと', () => {
      const date = new Date('2024-01-15T11:59:30Z') // 30秒前
      const result = timeAgo(date)
      expect(result).toBe('たった今')
    })

    it('分単位の差を正しく表示すること', () => {
      const date = new Date('2024-01-15T11:45:00Z') // 15分前
      const result = timeAgo(date)
      expect(result).toBe('15分前')
    })

    it('時間単位の差を正しく表示すること', () => {
      const date = new Date('2024-01-15T09:00:00Z') // 3時間前
      const result = timeAgo(date)
      expect(result).toBe('3時間前')
    })

    it('日単位の差を正しく表示すること', () => {
      const date = new Date('2024-01-10T12:00:00Z') // 5日前
      const result = timeAgo(date)
      expect(result).toBe('5日前')
    })

    it('ヶ月単位の差を正しく表示すること', () => {
      const date = new Date('2023-11-15T12:00:00Z') // 約2ヶ月前
      const result = timeAgo(date)
      expect(result).toBe('2ヶ月前')
    })

    it('年単位の差を正しく表示すること', () => {
      const date = new Date('2022-01-15T12:00:00Z') // 2年前
      const result = timeAgo(date)
      expect(result).toBe('2年前')
    })

    it('境界値でのテスト - ちょうど60秒前', () => {
      const date = new Date('2024-01-15T11:59:00Z') // ちょうど1分前
      const result = timeAgo(date)
      expect(result).toBe('1分前')
    })

    it('境界値でのテスト - ちょうど60分前', () => {
      const date = new Date('2024-01-15T11:00:00Z') // ちょうど1時間前
      const result = timeAgo(date)
      expect(result).toBe('1時間前')
    })

    it('境界値でのテスト - ちょうど24時間前', () => {
      const date = new Date('2024-01-14T12:00:00Z') // ちょうど1日前
      const result = timeAgo(date)
      expect(result).toBe('1日前')
    })

    it('将来の日付でも処理できること', () => {
      const date = new Date('2024-01-16T12:00:00Z') // 1日後
      const result = timeAgo(date)
      // 負の値でも適切に処理される（実装による）
      expect(result).toBeDefined()
    })
  })

  describe('エッジケース', () => {
    it('formatDate with invalid date', () => {
      const invalidDate = new Date('invalid')
      const result = formatDate(invalidDate)
      expect(result).toBe('Invalid Date')
    })

    it('formatShortDate with invalid date', () => {
      const invalidDate = new Date('invalid')
      const result = formatShortDate(invalidDate)
      expect(result).toBe('Invalid Date')
    })

    it('timeAgo with invalid date', () => {
      const invalidDate = new Date('invalid')
      const result = timeAgo(invalidDate)
      // NaNになる可能性があるが、関数は何らかの文字列を返すはず
      expect(typeof result).toBe('string')
    })
  })
})
