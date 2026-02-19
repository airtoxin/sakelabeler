# CLAUDE.md

## プロジェクト概要

**さけラベラー (sakelabeler)** — 飲食店で飲んだお酒を記録・管理するWebアプリ。写真、位置情報、評価、風味タグなどを付けて記録できる。データはブラウザのIndexedDBに保存されるクライアント完結型アプリ。

## コマンド

```bash
pnpm install    # 依存関係インストール
pnpm dev        # 開発サーバー起動 (localhost:3000)
pnpm build      # プロダクションビルド
pnpm lint       # ESLint実行
```

パッケージマネージャーは **pnpm**。npm/yarnは使わない。

テストフレームワークは未導入。

## 技術スタック

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS 4** (PostCSS経由)
- **IndexedDB** (`idb`ライブラリ) — クライアントサイドストレージ
- **Leaflet** + **react-leaflet** — 地図表示・位置情報
- **ESLint 9** (flat config) — `eslint-config-next` の core-web-vitals + typescript

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router ページ
│   ├── page.tsx            # ホーム（一覧・フィルタ）
│   ├── layout.tsx          # ルートレイアウト（メタデータ、フォント、PWA）
│   ├── globals.css         # グローバルCSS（Tailwindインポート、ダークモード変数）
│   ├── manifest.ts         # PWAマニフェスト
│   ├── new/page.tsx        # 新規登録ページ
│   └── [id]/page.tsx       # 詳細・編集ページ
├── components/             # UIコンポーネント
│   ├── SakeForm.tsx        # 登録・編集フォーム（新規/編集共用）
│   ├── SakeCard.tsx        # 一覧カード表示
│   ├── Header.tsx          # ナビゲーションヘッダー
│   ├── PhotoPicker.tsx     # 写真アップロード・リサイズ
│   ├── StarRating.tsx      # 5段階評価
│   ├── FlavorTagPicker.tsx # 酒種別・風味タグ選択
│   ├── LocationPicker.tsx  # 位置情報入力UI
│   ├── LocationMap.tsx     # Leaflet地図（dynamic import, SSR無効）
│   ├── AlcoholTypeFilter.tsx # 酒種別＋タグフィルタ
│   ├── RatingFilter.tsx    # 評価フィルタ
│   ├── EmptyState.tsx      # 空状態表示
│   └── ConfirmDialog.tsx   # 削除確認ダイアログ
├── hooks/
│   └── useSakeRecords.ts   # CRUD操作・状態管理カスタムフック
└── lib/
    ├── types.ts            # 型定義（SakeRecord, SakeStorage等）
    ├── storage.ts          # ストレージ抽象レイヤー
    ├── storage-idb.ts      # IndexedDB実装（マイグレーションv1-v4）
    ├── alcohol-types.ts    # 酒種別定義（ラベル、色、風味タグ）
    └── utils.ts            # ユーティリティ（画像リサイズ、日付フォーマット）
```

## データモデル

```typescript
type SakeRecord = {
  id: string;              // UUID
  name: string;            // 銘柄名
  photos: SakePhoto[];     // 写真（複数、カバー写真指定可能）
  alcoholType: AlcoholType; // "nihonshu" | "beer" | "wine" | "shochu" | "whiskey" | ""
  tags: string[];          // 風味タグ
  restaurant: string;      // 飲食店名
  origin: string;          // 産地
  location: Location | null; // 位置情報 { lat, lng }
  date: string;            // 日付
  rating: number;          // 1-5
  memo: string;            // メモ
  createdAt: string;       // 作成日時
  updatedAt: string;       // 更新日時
};
```

## アーキテクチャ上の留意点

- **サーバーサイド処理なし**: API Routes不使用。データはすべてIndexedDBに保存。
- **ストレージ抽象化**: `SakeStorage`インターフェースで抽象化済み。現在の実装は`IDBSakeStorage`のみ。
- **IndexedDBマイグレーション**: `storage-idb.ts`にv1→v4のマイグレーション定義あり。スキーマ変更時はDB_VERSIONをインクリメントしてupgrade関数にマイグレーション追加。
- **地図コンポーネント**: `LocationMap.tsx`は`next/dynamic`でSSR無効化して読み込み（Leafletはwindow依存のため）。
- **画像処理**: アップロード時にクライアントサイドで最大800px・JPEG品質0.7にリサイズ。画像はBase64 Data URLとしてIndexedDBに保存。
- **PWA対応**: `manifest.ts`でスタンドアロンモード設定済み。
- **UIは全て日本語**。HTMLのlangも`ja`。
- **パスエイリアス**: `@/*` → `./src/*`
