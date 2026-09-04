# fld

小さな Web ツールを集めた GitHub Pages サイトです。

公開 URL: https://d1y1.github.io/fld/

## ツール一覧

| ツール | パス | 説明 |
| --- | --- | --- |
| [めしガチャ](meshigacha/) | `/meshigacha/` | 現在地周辺の外食店からランダムで今日のごはんを決める |

## ローカルで確認

```bash
npx serve .
# または
python3 -m http.server 8080
```

ルートの `index.html` がハブページです。各ツールはサブディレクトリに置きます。

## ツールを追加するとき

1. リポジトリ直下にディレクトリを作る（例: `mytool/`）
2. その中に静的サイト（`index.html` など）を置く
3. ルートの `index.html` の Tools 一覧にリンクを追加する
