# カバー写真・醸造所名の隔離検証

`origin/main` の `f72427da5890573a3a0c5fef3f71f1c4b6f41730` を基準にした回帰テスト。
本番URL、認証情報、ユーザープロファイルは使わない。

## 実行

Node.js 22 と pnpm を使用。

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:db
pnpm test:build:isolated
pnpm test:e2e
pnpm exec tsc --noEmit --incremental false
pnpm lint
```

既存のChromeをヘッドレスで使う場合は、`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` に実行ファイルの絶対パスを指定できる。

`test:build:isolated` はテスト専用のループバックURLとダミーキーを埋め込んだ `.next` を生成する。
**このビルド成果物を公開しないこと。** 公開時は、承認された通常の環境変数で `pnpm build` をやり直す。

## 確認範囲

- SQL: リポジトリ内の全マイグレーションをPGlite（Postgres）で実行。旧行を保持した列追加、空文字の既定値、旧形式のINSERT、日本語の登録・更新・消去を確認。
- 権限: 変更前後のRLSポリシーが同一であること、所有者と共有相手が編集でき、第三者が閲覧・更新・他人名義の作成をできないことを確認。
- ブラウザー: 製品ビルドと実際のSupabase JavaScript SDKを使用。Auth・PostgREST・StorageのHTTP応答だけをテスト用に置換し、レコードは同じPGliteのSQL/RLSを通す。アップロード画像はテストプロセス内のメモリに保持。
- UI: ホバーのないタッチ環境でカバー変更、新規保存、編集、再読み込み、一覧・詳細の表示、変更取消、醸造所だけの登録、空欄化、DB間コピーを確認。
- 異常系: 画像デコード失敗、画像変換中の保存抑止、写真メタデータ更新失敗の表示と再試行、カバー写真削除時の繰り上げを確認。
- `test-results/` にJSON結果とモバイル画面のPNGを出力。Git対象外。

この環境にはDockerがないため、実際のローカルSupabase（GoTrue/PostgREST/Storage一式）での検証は未実施。
PGliteのauth/storageスキーマはテスト用の最小構成で、上記のHTTP処理はテスト代替である。
Dockerを利用できる環境では、既存のSupabaseマイグレーション検証で実際のローカルSupabaseも確認できる。

## マイグレーションと公開

新規マイグレーションは `20261023085539_add_brewery_to_sake_records.sql`。
`public.sake_records` に `brewery text NOT NULL DEFAULT ''` を追加する。既存の列・行・RLS・公開範囲は変更しない。

この列追加は、ユーザー承認後の2026-10-23に既存のSupabase接続から本番へ適用済み。
適用後に列の型・既定値・NOT NULL、既存記録・写真・共有設定のハッシュ、RLSポリシーの不変性を確認した。
ローカルのファイル番号はSupabaseの適用済み履歴と一致させてあり、同じ列追加を重複して実行する必要はない。

現在の `push-migrations.yml` はmainへのマイグレーション変更pushで本番適用を自動実行するため、公開前に本番履歴に本ファイルのバージョンが存在することを確認する。
UIは既存のGit連携で公開し、GitHubのコミット・デプロイステータスで結果を確認する。
別の未適用環境へ展開するときは、列追加を先に完了してから新UIを公開する。
