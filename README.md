# edge-cc

ローカルLLM（Gemma 4）を使った自律型コーディングエージェントのデモアプリケーションです。

Claude Codeのようなエージェントが「チャットAIとどう違うのか」を体感できる教育用ツールとして設計されています。

## 対象ユーザー

- **若手エンジニア** — AIエージェントの仕組みに興味があり、アーキテクチャを理解したい方
- **ローカルLLMに関心がある方** — クラウドAIのサブスクリプションやAPI利用にためらいがある方

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

## 主な機能

- **エージェントループ** — LLM問い合わせ → ツール実行 → 結果判断を自律的に繰り返し
- **ガイドモード** — エージェントの各ステップに初心者向け解説を表示（ヘッダーの「ガイド」ボタンで ON/OFF）
- **ワークスペース** — エージェントが作成したファイルの閲覧、Finderで開く機能
- **ファイル実行** — ワークスペース内の .py / .js / .sh 等のファイルをブラウザから直接実行
- **About ページ** — アーキテクチャ、エージェントループ、LLM進化の学習コンテンツ

## 技術スタック

- **フロントエンド**: Next.js 16 / React 19 / Tailwind CSS 4
- **LLMバックエンド**: llama.cpp + Gemma 4 E4B
- **外部ライブラリ不使用**: AI SDKなどを使わず、fetch + ReadableStream で仕組みを透明に実装

## セットアップ

### 前提条件

- Node.js 24+
- [llama.cpp](https://github.com/ggml-org/llama.cpp) がインストール済み
- Gemma 4 E4B のモデルファイル（GGUF形式）

### 1. リポジトリのクローンと依存関係インストール

```bash
git clone https://github.com/Takashi-Matsumura/edge-cc.git
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

## Docker でのデプロイ

ホスト側で llama.cpp が起動している環境に Docker コンテナとしてデプロイできます。

### 1. 設定

```bash
cp .env.example .env
```

`.env` を編集してポート番号と llama.cpp の接続先を設定してください:

```env
# ホスト側の公開ポート（他のコンテナとぶつからないように変更）
PORT=8888

# llama.cpp の接続先
LLAMA_CPP_URL=http://host.docker.internal:8080
```

### 2. ビルド & 起動

```bash
docker compose up -d --build
```

`http://<ホストIP>:<PORT>` でアクセスできます。

## 使い方

1. 左側のチャットパネルにエージェントへの指示を入力します
2. エージェントがツールを使って自律的にタスクを実行する様子がリアルタイムで表示されます
3. 右側のワークスペースパネルでエージェントが作成したファイルを確認・実行できます
4. 「ガイド」ボタンをONにすると、各ステップの解説が表示されます

### 試してみる例

- 「hello.txt に Hello World と書いてください」
- 「Python で FizzBuzz を作って実行してください」
- 「ワークスペースのファイルを一覧してください」

## プロジェクト構成

```
lib/
  agent/
    types.ts           # 型定義（AgentEvent, ToolCall 等）
    tools.ts           # ツール定義（LLMに渡す関数スキーマ）
    executor.ts        # ツール実行エンジン（サンドボックス）
    loop.ts            # エージェントループ（AsyncGenerator）
    guide.ts           # ガイドモードの解説生成
    system-prompt.ts   # システムプロンプト
  llm/
    client.ts          # llama.cpp APIクライアント（Function Calling対応）
app/
  page.tsx             # メインページ（2パネルレイアウト）
  about/page.tsx       # About ページ（学習コンテンツ）
  api/chat/route.ts    # SSEストリーミングエンドポイント
  api/workspace/       # ワークスペースAPI（ファイル操作・実行・Finder連携）
components/
  chat/                # チャットUI（メッセージ、ツールカード、ガイド注釈）
  workspace/           # ワークスペースUI（ファイルツリー、ビューア、実行）
  layout/              # ヘッダー（ステータス、ガイドモード切替）
```

## ライセンス

[MIT](./LICENSE)
