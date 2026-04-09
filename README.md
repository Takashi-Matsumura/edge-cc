# edge-cc

ローカルLLM（Gemma 4）を使った自律型コーディングエージェントのデモアプリケーションです。

Claude Codeのようなエージェントが「チャットAIとどう違うのか」を体感できる教育用ツールとして設計されています。

## チャットAIとエージェントの違い

| | チャットAI | エージェント (edge-cc) |
|---|---|---|
| 動作 | 質問に答える | ツールを使ってタスクを実行する |
| ファイル操作 | できない | 読み書き・検索が可能 |
| コマンド実行 | できない | シェルコマンドを実行可能 |
| 自律性 | 1回の応答で完結 | 目的達成までループする |

## アーキテクチャ

```
[ブラウザ] <--SSE--> [Next.js API Route] <--HTTP--> [llama.cpp (Gemma 4)]
                            |
                     [ツール実行エンジン]
                            |
                     [サンドボックス: /tmp/edge-cc-workspace/]
```

エージェントは以下のツールを自律的に使い分けます:

- **read_file** - ファイル読み取り
- **write_file** - ファイル作成・編集
- **list_files** - ディレクトリ一覧
- **run_command** - シェルコマンド実行
- **search_files** - ファイル内検索

## 技術スタック

- **フロントエンド**: Next.js 16 / React 19 / Tailwind CSS 4
- **LLMバックエンド**: llama.cpp + Gemma 4 E4B
- **外部ライブラリ不使用**: AI SDKなどを使わず、fetch + ReadableStream で仕組みを透明に実装

## セットアップ

### 前提条件

- Node.js 20+
- [llama.cpp](https://github.com/ggml-org/llama.cpp) がインストール済み
- Gemma 4 E4B のモデルファイル（GGUF形式）

### 1. リポジトリのクローンと依存関係インストール

```bash
git clone https://github.com/<your-username>/edge-cc.git
cd edge-cc
npm install
```

### 2. llama.cpp サーバの起動

```bash
llama-server -m <path-to-gemma4-e4b.gguf> --port 8080
```

デフォルトでは `http://localhost:8080` に接続します。変更する場合は環境変数を設定してください:

```bash
export LLAMA_CPP_URL=http://localhost:8080
```

### 3. 開発サーバの起動

```bash
npm run dev
```

http://localhost:3000 にアクセスしてください。

## 使い方

1. 左側のチャットパネルにエージェントへの指示を入力します
2. エージェントがツールを使って自律的にタスクを実行する様子がリアルタイムで表示されます
3. 右側のワークスペースパネルでエージェントが作成したファイルを確認できます

### 試してみる例

- 「hello.txt に Hello World と書いてください」
- 「Python で FizzBuzz を作って実行してください」
- 「簡単な HTML ページを作成してください」

## プロジェクト構成

```
lib/
  agent/
    types.ts           # 型定義
    tools.ts           # ツール定義
    executor.ts        # ツール実行エンジン（サンドボックス）
    loop.ts            # エージェントループ（AsyncGenerator）
    system-prompt.ts   # システムプロンプト
  llm/
    client.ts          # llama.cpp APIクライアント
app/
  page.tsx             # メインページ（2パネルレイアウト）
  api/chat/route.ts    # SSEストリーミングエンドポイント
  api/workspace/       # ワークスペースAPI
components/
  chat/                # チャットUI
  workspace/           # ワークスペースUI
  layout/              # ヘッダー等
```

## ライセンス

[MIT](./LICENSE)
