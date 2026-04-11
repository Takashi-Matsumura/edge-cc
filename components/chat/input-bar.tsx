"use client";

import { useState, useRef } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
  planMode: boolean;
  onTogglePlanMode: () => void;
}

const EXAMPLES = [
  "hello.txt に「Hello World」と書いてください",
  "Pythonで FizzBuzz を作って実行してください",
  "ワークスペースのファイルを一覧してください",
];

export function InputBar({
  onSend,
  disabled,
  planMode,
  onTogglePlanMode,
}: InputBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        <div className="flex gap-2 flex-wrap">
          {!disabled &&
            input === "" &&
            EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {ex}
              </button>
            ))}
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
