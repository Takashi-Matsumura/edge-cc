import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-70 transition-opacity">
            edge-cc
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
            自律型コーディングエージェント デモ
          </span>
        </div>
        <Link
          href="/"
          className="text-sm px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 transition-opacity"
        >
          デモを試す →
        </Link>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* イントロ */}
        <section className="mb-16">
          <h1 className="text-3xl font-bold mb-4">edge-cc とは</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            edge-cc は、Claude Code のような<strong className="text-gray-900 dark:text-white">自律型コーディングエージェント</strong>が
            どのように動いているかを学ぶためのデモアプリです。
            ローカルで動作する LLM（llama.cpp + Gemma 4）を使い、
            クラウド API やサブスクリプション契約なしで、エージェントの仕組みを体験できます。
          </p>
        </section>

        {/* 対象ユーザー */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">誰のためのアプリか</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <div className="text-lg font-semibold mb-2">若手エンジニア</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI エージェントの仕組みに興味はあるが、実際のアーキテクチャを理解したい方。
                コードを読みながら「エージェントループ」の全体像を掴めます。
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <div className="text-lg font-semibold mb-2">ローカル LLM に関心がある方</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                クラウド AI のサブスクリプションや API 利用にためらいがある方。
                手元のマシンだけで完結する AI エージェントを体験できます。
              </p>
            </div>
          </div>
        </section>

        {/* アーキテクチャ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">アーキテクチャ</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 font-mono text-sm leading-loose">
            <div className="flex flex-col items-center gap-1">
              <div className="px-4 py-2 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
                ユーザーの指示
              </div>
              <div className="text-gray-400">↓</div>
              <div className="px-4 py-2 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-semibold">
                Next.js API Route（/api/chat）
              </div>
              <div className="text-gray-400">↓</div>
              <div className="px-4 py-2 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-semibold">
                エージェントループ（最大15回）
              </div>
              <div className="text-gray-400 flex items-center gap-2">
                <span>↓</span>
                <span className="text-xs font-sans">繰り返し</span>
                <span>↑</span>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <div className="px-4 py-2 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-semibold">
                  llama.cpp（Gemma 4）
                </div>
                <div className="px-4 py-2 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 font-semibold">
                  ツール実行
                </div>
              </div>
              <div className="text-gray-400">↓</div>
              <div className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 font-semibold">
                ワークスペース（ファイル操作）
              </div>
            </div>
          </div>
        </section>

        {/* エージェントループの説明 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">エージェントループとは</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            通常のチャット AI は「質問に答える」だけですが、コーディングエージェントは
            <strong className="text-gray-900 dark:text-white">「考えて → ツールを使って → 結果を見て → また考える」</strong>
            というループを自律的に繰り返します。
          </p>
          <ol className="space-y-4">
            {[
              {
                step: "1",
                title: "LLM に問い合わせ",
                desc: "ユーザーの指示とこれまでの会話履歴を LLM に送り、次のアクションを判断させます。",
              },
              {
                step: "2",
                title: "ツール呼び出しを検出",
                desc: "LLM の応答に tool call が含まれていれば、該当するツールを実行します。含まれていなければループ終了。",
              },
              {
                step: "3",
                title: "ツールを実行",
                desc: "ファイルの読み書き、コマンド実行などを行い、結果を会話履歴に追加します。",
              },
              {
                step: "4",
                title: "結果をもとに再判断",
                desc: "ツールの実行結果を見て、LLM が次に何をすべきかを再び判断します。ステップ 1 に戻ります。",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ツール一覧 */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">利用可能なツール</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            エージェントは以下の 5 つのツールを使ってタスクを遂行します。
            Claude Code など実際のエージェントでも、同様の仕組みでファイル操作やコマンド実行を行っています。
          </p>
          <div className="space-y-3">
            {[
              { name: "read_file", desc: "ファイルの内容を読み取る" },
              { name: "write_file", desc: "ファイルを作成・上書きする" },
              { name: "list_files", desc: "ディレクトリの中身を一覧表示する" },
              { name: "run_command", desc: "シェルコマンドを実行する（10秒タイムアウト）" },
              { name: "search_files", desc: "ファイル内のテキストを検索する" },
            ].map((tool) => (
              <div
                key={tool.name}
                className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3"
              >
                <code className="text-sm font-mono font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {tool.name}
                </code>
                <span className="text-sm text-gray-600 dark:text-gray-400">{tool.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 技術スタック */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">技術スタック</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "フロントエンド", value: "Next.js 16 + React 19" },
              { label: "スタイリング", value: "Tailwind CSS 4" },
              { label: "LLM 推論", value: "llama.cpp（OpenAI互換API）" },
              { label: "モデル", value: "Gemma 4 E4B（ローカル実行）" },
              { label: "言語", value: "TypeScript" },
              { label: "API 方式", value: "Streaming（Server-Sent Events）" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-baseline gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3"
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* コードを読むポイント */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">ソースコードの読みどころ</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            このアプリの仕組みを理解するために、特に注目してほしいファイルです。
          </p>
          <div className="space-y-3">
            {[
              {
                path: "lib/agent/loop.ts",
                desc: "エージェントループの本体。LLM呼び出し → ツール実行 → 再呼び出しの繰り返しを制御",
              },
              {
                path: "lib/agent/tools.ts",
                desc: "ツールの定義。LLM に渡す関数スキーマと説明文",
              },
              {
                path: "lib/agent/executor.ts",
                desc: "ツールの実際の実行ロジック。ファイル操作やコマンド実行の実装",
              },
              {
                path: "lib/agent/system-prompt.ts",
                desc: "システムプロンプト。LLM にエージェントとしての振る舞いを指示",
              },
              {
                path: "lib/llm/client.ts",
                desc: "llama.cpp との通信。OpenAI互換APIの呼び出しとtool callのパース",
              },
            ].map((item) => (
              <div
                key={item.path}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3"
              >
                <code className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {item.path}
                </code>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 注意事項 */}
        <section className="mb-16">
          <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-5">
            <h2 className="text-lg font-bold mb-2">注意</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              このアプリはコーディングエージェントの<strong>仕組みを理解する</strong>ことを目的としています。
              ローカル LLM の性能には限りがあるため、コーディングの精度は商用 AI エージェントには及びません。
              「なぜエージェントがこのように動くのか」というアーキテクチャの理解にご活用ください。
            </p>
          </div>
        </section>

        {/* フッター */}
        <footer className="text-center text-sm text-gray-400 dark:text-gray-600 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p>edge-cc — 自律型コーディングエージェント デモ</p>
        </footer>
      </main>
    </div>
  );
}
