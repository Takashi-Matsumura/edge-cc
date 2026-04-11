"use client";

import { useState, useRef } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
  planMode: boolean;
  onTogglePlanMode: () => void;
  attachedRoot: string | null;
  workspaceTab: "workspace" | "attached";
}

/**
 * サンプルプロンプトは **右側パネルで選択中のタブ × Plan Mode** の 4 通りで切り替える。
 * 初めて使う人が「タブを切り替える / Plan Mode をトグルする」だけで、エージェント
 * のどんな使い方ができるのかを体験できるようにするのが狙い。
 *
 * - Workspace タブ × 通常モード:
 *     ワークスペース（/tmp/edge-cc-workspace）に **書き込み & 実行** する
 *     コーディングエージェント的なサンプル
 * - Workspace タブ × Plan Mode:
 *     ワークスペースの構成を **調査 → 計画** する（read-only）
 * - Attached タブ × 通常モード:
 *     アタッチした既存プロジェクトを **read-only で調査** する
 * - Attached タブ × Plan Mode:
 *     大きめのコードベース（C# 想定）を **計画立案付きで分析** する
 */
const WORKSPACE_NORMAL_EXAMPLES = [
  "hello.txt に「Hello World」と書いてください",
  "Pythonで FizzBuzz を作って実行してください",
  "ワークスペースのファイルを一覧してください",
];

const WORKSPACE_PLAN_EXAMPLES = [
  "ワークスペースを調査して構成をまとめてください",
  "このプロジェクトにテストを追加する計画を立ててください",
  "TODO コメントを探して対応計画を作ってください",
];

const ATTACHED_NORMAL_EXAMPLES = [
  "@attached/ の直下を一覧してください",
  "@attached/ から .csproj を探して scan_csproj で解析してください",
  "@attached/ のエントリポイントを特定してください",
];

const ATTACHED_PLAN_EXAMPLES = [
  "このプロジェクトの概要を教えてください",
  "使用している NuGet パッケージの一覧と役割をまとめてください",
  "API エンドポイントを洗い出してください",
  "主要なクラスと責務をまとめてください",
];

function pickExamples(
  planMode: boolean,
  workspaceTab: "workspace" | "attached"
): string[] {
  if (workspaceTab === "attached") {
    return planMode ? ATTACHED_PLAN_EXAMPLES : ATTACHED_NORMAL_EXAMPLES;
  }
  return planMode ? WORKSPACE_PLAN_EXAMPLES : WORKSPACE_NORMAL_EXAMPLES;
}

export function InputBar({
  onSend,
  disabled,
  planMode,
  onTogglePlanMode,
  attachedRoot,
  workspaceTab,
}: InputBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const examples = pickExamples(planMode, workspaceTab);
  const isAttachedTab = workspaceTab === "attached";
  // Attached タブだがまだアタッチしていない場合のヒント
  const needsAttach = isAttachedTab && !attachedRoot;

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    // 自動リサイズ
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }

  const placeholder = planMode
    ? "Plan Mode: 指示を入力すると、まず調査して計画を立てます..."
    : "エージェントへの指示を入力...";

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex gap-2 flex-wrap items-center">
          {!disabled && input === "" && (
            <>
              {needsAttach && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                  ヘッダーの 📎 からディレクトリをアタッチするとサンプルが試せます
                </span>
              )}
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setInput(ex)}
                  disabled={needsAttach}
                  className={`text-xs px-2 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    planMode
                      ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60"
                      : isAttachedTab
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {ex}
                </button>
              ))}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onTogglePlanMode}
          disabled={disabled}
          className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
            planMode
              ? "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Plan Mode: 先に調査と計画を立ててから実行する"
        >
          {planMode ? "● Plan Mode ON" : "○ Plan Mode OFF"}
        </button>
      </div>
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={`flex-1 resize-none rounded-lg border bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${
            planMode
              ? "border-purple-300 dark:border-purple-700 focus:ring-purple-500"
              : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
          }`}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className={`px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            planMode
              ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          送信
        </button>
      </div>
    </div>
  );
}
