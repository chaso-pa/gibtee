# Admin Panel テスト

このドキュメントは、admin-panelサービスの単体テストに関する情報を提供します。

## テスト構成

### テストフレームワーク
- **Vitest**: 高速なユニットテストフレームワーク
- **Testing Library**: Reactコンポーネントのテスト
- **MSW**: APIモッキング
- **User Event**: ユーザーインタラクションのシミュレーション

### テストカバレッジ
目標カバレッジ: **80%以上**

## テスト実行方法

### 基本的なテスト実行
```bash
# 全テストを実行
yarn test

# ウォッチモードでテスト実行
yarn test --watch

# 特定のファイルのテストを実行
yarn test src/features/auth/Login.test.tsx
```

### カベレッジレポート生成
```bash
# カバレッジ付きでテスト実行
yarn test:coverage

# カバレッジレポートをHTMLで確認
yarn test:coverage --reporter=html
open coverage/index.html
```

### UIモードでのテスト実行
```bash
# Vitest UIでテスト実行
yarn test:ui
```

## テスト対象機能

### ✅ 実装済み

#### APIライブラリ (`src/lib/api.ts`)
- Axiosインスタンスの初期化
- リクエストインターセプター（認証トークン追加）
- レスポンスインターセプター（401エラーハンドリング）

#### 認証機能 (`src/features/auth/Login.tsx`)
- ログインフォームのレンダリング
- バリデーション機能
- ログインAPI呼び出し
- 成功時のリダイレクト
- エラーハンドリング
- ローディング状態

#### 注文管理機能 (`src/features/orders/OrderList.tsx`)
- 注文一覧表示
- フィルタリング機能
- 検索機能
- ページネーション
- 注文詳細への遷移
- エラーハンドリング

#### ユーティリティ関数
- **日付関数** (`src/utils/date.ts`):
  - `formatDate`: 日付フォーマット
  - `formatShortDate`: 短い日付フォーマット
  - `parseDate`: 日付パース
  - `timeAgo`: 相対時間表示

- **フォーマット関数** (`src/utils/format.ts`):
  - `formatPrice`: 価格フォーマット
  - `formatNumber`: 数値フォーマット
  - `formatTrackingNumber`: 追跡番号フォーマット
  - `formatPhoneNumber`: 電話番号フォーマット
  - `formatPostalCode`: 郵便番号フォーマット

### 🔄 今後実装予定

#### 画像管理機能
- S3から画像取得
- 画像表示・プレビュー

#### プリント管理機能
- プリントサービス連携
- 注文データの出力・変換

#### その他のAPIエンドポイント
- エラーハンドリング
- バリデーション機能

## テストファイル構造

```
src/
├── lib/
│   └── __tests__/
│       └── api.test.ts
├── features/
│   ├── auth/
│   │   └── __tests__/
│   │       └── Login.test.tsx
│   └── orders/
│       └── __tests__/
│           └── OrderList.test.tsx
├── utils/
│   └── __tests__/
│       ├── date.test.ts
│       └── format.test.ts
└── test/
    └── setup.ts
```

## CI/CD統合

### 推奨ワークフロー
```yaml
# .github/workflows/admin-panel-tests.yml
name: Admin Panel Tests

on:
  push:
    branches: [master, develop]
    paths: ['services/admin-panel/**']
  pull_request:
    branches: [master, develop]
    paths: ['services/admin-panel/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn lint
      - run: yarn test:coverage
      - run: yarn build
```

### カバレッジゲート
プルリクエスト時にカバレッジが80%未満の場合はCI/CDが失敗するよう設定することを推奨します。

## モック戦略

### APIモック
- `api.ts`: `vi.mock()`を使用してAxiosをモック
- MSW使用は今後の課題

### 外部依存関係モック
- React Router: `useNavigate`, `useLocation`
- Chakra UI: `useToast`
- TanStack Query: `useQuery`

### ブラウザAPIモック
- `localStorage`
- `window.location`
- `matchMedia`
- `ResizeObserver`
- `IntersectionObserver`

## ベストプラクティス

### テスト命名規則
- **英語**: `describe('ComponentName', () => {})`
- **日本語**: テスト内容の説明 `it('正しくレンダリングされること', () => {})`

### アサーション
- 具体的で分かりやすいアサーション
- エッジケースのテスト
- エラー状態のテスト

### テストの独立性
- 各テスト間で状態を共有しない
- `beforeEach`/`afterEach`でのクリーンアップ

## トラブルシューティング

### よくある問題

#### 1. Chakra UIコンポーネントが見つからない
```typescript
// TestWrapperでChakraProviderを使用
const TestWrapper = ({ children }) => (
  <ChakraProvider>
    {children}
  </ChakraProvider>
)
```

#### 2. React Routerのエラー
```typescript
// BrowserRouterでラップ
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ChakraProvider>
      {children}
    </ChakraProvider>
  </BrowserRouter>
)
```

#### 3. TanStack Queryのエラー
```typescript
// QueryClientProviderでラップ
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})

const TestWrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)
```

## 参考資料

- [Vitest ドキュメント](https://vitest.dev/)
- [Testing Library ドキュメント](https://testing-library.com/)
- [MSW ドキュメント](https://mswjs.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
