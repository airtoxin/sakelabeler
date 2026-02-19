# さけラベラー

飲食店で飲んだお酒を記録・管理するWebアプリケーション。

## 機能

- お酒の銘柄、写真、飲食店名、産地、日付、メモを記録
- 5段階の評価
- 酒種別の分類（日本酒・ビール・ワイン・焼酎・ウイスキー）と風味タグ付け
- 位置情報の記録と地図表示
- 酒種別・評価・タグによるフィルタリング
- 複数写真の管理とカバー写真の選択
- ダークモード対応
- PWA対応（スタンドアロンモード）

## 技術スタック

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/) (地図)
- [idb](https://github.com/jakearchibald/idb) (IndexedDB)

## セットアップ

```bash
pnpm install
```

## 開発

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開く。

## ビルド

```bash
pnpm build
pnpm start
```

## リント

```bash
pnpm lint
```
