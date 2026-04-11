"use client";

import { useState, useEffect, useRef } from "react";

interface AttachModalProps {
  isOpen: boolean;
  currentPath: string | null;
  onClose: () => void;
  onAttach: (normalizedPath: string) => void;
  onDetach: () => void;
}

export function AttachModal({
  isOpen,
  currentPath,
  onClose,
  onAttach,
  onDetach,
}: AttachModalProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInput(currentPath ?? "");
      setError(null);
      setSubmitting(false);
      // 少し遅らせてフォーカス
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, currentPath]);

  async function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("パスを入力してください");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "アタッチに失敗しました");
        return;
      }
      onAttach(data.path);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "アタッチ中にエラーが発生しました"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleDetach() {
    onDetach();
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Directory をアタッチ
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            既存のプロジェクトディレクトリを <strong>read-only</strong> で読み込みます。
            エージェントは <code>@attached/</code> 接頭辞でこのディレクトリを参照できます。
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <label className="block">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              絶対パス（~ も使用可）
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="/Users/you/projects/my-csharp-project"
              disabled={submitting}
              className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </label>

          {currentPath && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              現在アタッチ中: <code className="text-gray-700 dark:text-gray-300">{currentPath}</code>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-1.5 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
          <div>
            {currentPath && (
              <button
                type="button"
                onClick={handleDetach}
                disabled={submitting}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                解除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white disabled:opacity-50"
            >
              {submitting ? "確認中..." : "アタッチ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
