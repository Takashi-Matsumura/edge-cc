"use client";

import type { PlanPayload, PlanStatus } from "@/lib/agent/types";

interface PlanCardProps {
  plan: PlanPayload;
  status: PlanStatus;
  onApprove: () => void;
  onReject: () => void;
}

export function PlanCard({ plan, status, onApprove, onReject }: PlanCardProps) {
  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  return (
    <div
      className={`my-3 mx-2 rounded-lg border overflow-hidden ${
        isRejected
          ? "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 opacity-70"
          : isApproved
          ? "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
          : "border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20"
      }`}
    >
      {/* ヘッダーバー */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          isRejected
            ? "border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/60"
            : isApproved
            ? "border-green-300 dark:border-green-800 bg-green-100 dark:bg-green-900/40"
            : "border-purple-300 dark:border-purple-800 bg-purple-100 dark:bg-purple-900/40"
        }`}
      >
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white ${
            isRejected
              ? "bg-gray-500"
              : isApproved
              ? "bg-green-600 dark:bg-green-500"
              : "bg-purple-600 dark:bg-purple-500"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3 h-3"
          >
            <path
              fillRule="evenodd"
              d="M4.5 2A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.44A1.5 1.5 0 0 0 8.878 2H4.5Zm1 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5Zm.5 2a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1H6Zm-.5 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5Z"
              clipRule="evenodd"
            />
          </svg>
          実行計画
        </span>
        <span
          className={`text-[11px] font-medium ${
            isRejected
              ? "text-gray-600 dark:text-gray-400"
              : isApproved
              ? "text-green-700 dark:text-green-300"
              : "text-purple-700 dark:text-purple-300"
          }`}
        >
          {isPending && "承認待ち"}
          {isApproved && "承認済み — 実行中／実行完了"}
          {isRejected && "却下 — 実行されませんでした"}
        </span>
      </div>

      {/* 本文（Markdown を等幅で表示、MVP） */}
      <pre className="px-3 py-3 text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">
        {plan.markdown}
      </pre>

      {/* アクション */}
      {isPending && (
        <div className="flex gap-2 px-3 pb-3 pt-1 border-t border-purple-200 dark:border-purple-900/60">
          <button
            onClick={onApprove}
            className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white text-xs font-medium transition-colors"
          >
            この計画で実行
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium transition-colors"
          >
            却下
          </button>
        </div>
      )}
    </div>
  );
}
