"use client";

import { useState, useRef } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const EXAMPLES = [
  "hello.txt に「Hello World」と書いてください",
  "Pythonで FizzBuzz を作って実行してください",
  "ワークスペースのファイルを一覧してください",
];

export function InputBar({ onSend, disabled }: InputBarProps) {
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

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      {!disabled && input === "" && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="エージェントへの指示を入力..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !input.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          送信
        </button>
      </div>
    </div>
  );
}
