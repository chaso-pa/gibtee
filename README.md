# gibtee

LINE上で完結する自分の写真をジブリ風にAIで加工したうえでTシャツに貼って送ってくれるサービス。

## プロジェクト概要

gibteeは以下の機能を提供します：

1. LINEでの画像投稿とAI処理
2. ジブリ風に変換された画像のプレビュー
3. Tシャツへのプリントと購入フロー
4. 支払いと配送管理

## システム構成

- **LINE Bot**: ユーザーとのインターフェース（Node.js/Express）
- **管理画面**: 注文管理・処理用Web UI（React）
- **データベース**: MySQL（Prisma ORM）
- **ストレージ**: AWS S3（画像保存）
- **決済処理**: LINE Pay、Stripe
- **通知システム**: Slack（注文・エラー通知）

## 環境変数

主な環境変数：

```
# LINE Botの設定
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_CHANNEL_SECRET=xxx

# データベース設定
DATABASE_URL=mysql://username:password@localhost:3306/gibtee

# AWS設定
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=xxx

# 決済設定
LINE_PAY_CHANNEL_ID=xxx
LINE_PAY_CHANNEL_SECRET=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_PUBLISHABLE_KEY=xxx

# Slack通知設定
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
SLACK_CHANNEL=#gibtee-notifications
SLACK_USERNAME=gibtee-bot
```

## Slack通知機能

Slack通知機能は以下のイベントを通知します：

1. **新規注文通知**: 新しい注文が入った際に詳細情報を通知
2. **ステータス更新通知**: 注文ステータスが更新された際に変更内容を通知
3. **支払い完了通知**: 支払いが完了した際に決済情報を通知
4. **エラー通知**: サーバーエラー発生時に詳細情報を通知

### 設定方法

1. Slackで通知用のWebhook URLを取得
2. 環境変数にSlack設定を追加
3. サーバー再起動で反映

## 開発メモ

### スプリント進捗状況

- [x] スプリント1: 基盤構築・LINE Bot基本実装
- [x] スプリント2: 画像変換・注文基本フロー
- [x] スプリント3: 決済連携・管理画面基本実装（進行中）
  - [x] 決済機能連携
  - [x] 注文データベース完成
  - [x] 管理画面フレームワーク構築
  - [x] 注文一覧・詳細表示
  - [x] Slack通知システム (今回の実装)
- [ ] スプリント4: 完成・統合テスト・改善
