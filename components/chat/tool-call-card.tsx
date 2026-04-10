"use client";

import { useState } from "react";
import type { ToolCall, ToolResult } from "@/lib/agent/types";
import { formatToolArgs } from "@/lib/utils/format";

interface ToolCallCardProps {
  toolCall: ToolCall;
  result?: ToolResult;
}

const TOOL_LABELS: Record<string, { label: string; color: string }> = {
  read_file: { label: "ファイル読取", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  write_file: { label: "ファイル書込", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  list_files: { label: "一覧表示", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  run_command: { label: "コマンド実行", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  search_files: { label: "ファイル検索", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
};

export function ToolCallCard({ toolCall, result }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const toolInfo = TOOL_LABELS[toolCall.name] || {
    label: toolCall.name,
    color: "bg-gray-100 text-gray-700",
  };
  const isLoading = !result;

  return (
    <div className="my-1 ml-4 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${toolInfo.color}`}
        >
          {toolInfo.label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
          {formatToolArgs(toolCall)}
        </span>
        {isLoading ? (
          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : result.is_error ? (
          <span className="text-xs text-red-500">Error</span>
        ) : (
          <span className="text-xs text-green-500">Done</span>
        )}
        <span className="text-gray-400 text-xs group-hover:text-gray-600 transition-colors">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              引数:
            </div>
            <pre className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-2 overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
          {result && (
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                結果{result.is_error ? " (エラー)" : ""}:
              </div>
              <pre
                className={`text-xs rounded p-2 overflow-x-auto max-h-60 overflow-y-auto ${
                  result.is_error
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    : "bg-gray-50 dark:bg-gray-800"
                }`}
              >
                {result.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

