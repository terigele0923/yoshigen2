# 株式会社 吉源商事 ホームページ

HTML、CSS、JavaScript の静的サイトです。PHP やビルド処理は必要ありません。GitHub Pagesでは、移行先リポジトリの公開対象ブランチとルートフォルダを指定します。

## 現行ページ

| ファイル | 内容 |
| --- | --- |
| `index.html` | トップ |
| `company.html` | 企業情報 |
| `products.html` | 取扱商品 |
| `facilities.html` | 設備・実例 |
| `gallery.html` | 写真 |
| `contact.html` | 連絡先・アクセス |
| `photo-credits.html` | 写真の出典・ライセンス |

## 管理するファイル

- `data/i18n.json`: 日本語 (`ja`)、中国語 (`zh`)、英語 (`en`) の文章と各一覧の項目。各項目の `id` は3言語で共通にします。
- `data/site.json`: メイン画像、商品・設備・ギャラリーの画像、各ページの背景、Google Map の検索住所。画像パスはサイトのルートからの相対パスです。
- `images/`: 設備・ギャラリーなどの背景画像。使用するパスは `site.json` に指定します。
- `images/technical/`: 商品9品目とメインビジュアルに使用する実写真。画像参照は `data/site.json`、出典・作者・ライセンスは `photo-credits.html` に記録しています。写真を変更する場合は出典表記も更新してください。
- `css/style.css`: デザイン。
- `js/i18n.js`: 2つの JSON を読み込み、文章・カード・画像・地図を表示します。
- `js/main.js`: ナビゲーション、スクロール進捗、canvas、カードのホバー効果。
- `tools/check-content.js`: JSON の項目IDと画像パスの検証。

## データの流れ

ブラウザが HTML を開くと `js/i18n.js` が `data/site.json` と `data/i18n.json` を取得します。`site.json` の画像パスと、選択言語の `i18n.json` の文章を `id` で対応付けて画面に表示します。その後 `js/main.js` がcanvasなどの演出を開始します。言語ボタンを押すと、選択言語の文章と一覧を再描画します。言語設定の保存や演出が利用できない環境でも、本文の表示を妨げません。

内容を編集したら、リポジトリのルートで `node tools/check-content.js` を実行してください。表示確認にはローカルの HTTP サーバーを使います。`file://` で直接開くと JSON の取得がブラウザに拒否されます。
