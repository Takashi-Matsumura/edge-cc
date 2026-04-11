"use client";

import { useState } from "react";
import type { LLMUsage } from "@/lib/agent/types";

export interface LLMInfo {
  available: boolean;
  model?: string;
  n_ctx?: number | null;
  total_slots?: number | null;
  build_info?: string | null;
  error?: string;
}

interface ContextBadgeProps {
  info: LLMInfo | null;
  usage: LLMUsage | null;
}

/**
 * ヘッダー右上に出すコンテキスト使用量バッジ。
 * - 最新の prompt_tokens / n_ctx をプログレスバーで可視化
 * - クリックでポップオーバーを開き、モデル名・スロット数・詳細トークンを表示
 * - Gemma のような宣言値が大きいモデルは実用帯（〜16K）を「危険ライン」として黄色で表示
 */
export function ContextBadge({ info, usage }: ContextBadgeProps) {
  const [open, setOpen] = useState(false);

  const n_ctx = info?.n_ctx ?? null;
  const used = usage?.prompt_tokens ?? 0;
  const ratio = n_ctx && n_ctx > 0 ? used / n_ctx : 0;
  const percent = Math.min(100, Math.round(ratio * 1000) / 10);

  // 実用帯: 〜16K までは緑、〜32K までは黄、それ以上は赤
  const PRACTICAL_SAFE = 16 * 1024;
  const PRACTICAL_WARN = 32 * 1024;

  let barColor = "bg-green-500";
  let textColor = "text-green-700 dark:text-green-300";
  let borderColor = "border-green-400 dark:border-green-700";
  if (used >= PRACTICAL_WARN) {
    barColor = "bg-red-500";
    textColor = "text-red-700 dark:text-red-300";
    borderColor = "border-red-400 dark:border-red-700";
  } else if (used >= PRACTICAL_SAFE) {
    barColor = "bg-yellow-500";
    textColor = "text-yellow-700 dark:text-yellow-300";
    borderColor = "border-yellow-400 dark:border-yellow-700";
  }

  const available = info?.available ?? false;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`text-xs px-3 py-1.5 rounded border transition-colors flex items-center gap-2 ${
          available
            ? `${borderColor} hover:bg-gray-100 dark:hover:bg-gray-800`
            : "border-gray-300 dark:border-gray-700 text-gray-400"
        }`}
        title={
          available
            ? `${info?.model} — ${used.toLocaleString()} / ${n_ctx?.toLocaleString() ?? "?"} tokens`
            : "llama.cpp に接続できません"
        }
      >
        <span>🧠</span>
        {available && n_ctx ? (
          <>
            <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className={`font-mono ${textColor}`}>
              {formatCompact(used)}/{formatCompact(n_ctx)}
            </span>
          </>
        ) : (
          <span className="text-gray-500">未接続</span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-4 text-xs">
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ローカル LLM 情報
            </div>
            {available ? (
              <dl className="space-y-1.5 text-gray-700 dark:text-gray-300">
                <Row label="モデル" value={info?.model ?? "-"} mono />
                <Row
                  label="コンテキスト上限"
                  value={
                    n_ctx
                      ? `${n_ctx.toLocaleString()} tokens`
                      : "不明"
                  }
                />
                <Row
                  label="並列スロット"
                  value={info?.total_slots?.toString() ?? "-"}
                />
                {info?.build_info && (
                  <Row label="build" value={info.build_info} mono />
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  直近の使用量
                </div>
                {usage ? (
                  <>
                    <Row
                      label="prompt"
                      value={`${usage.prompt_tokens.toLocaleString()} tokens`}
                    />
                    <Row
                      label="completion"
                      value={`${usage.completion_tokens.toLocaleString()} tokens`}
                    />
                    <Row
                      label="total"
                      value={`${usage.total_tokens.toLocaleString()} tokens`}
                    />
                    {usage.cached_tokens !== undefined && (
                      <Row
                        label="cached"
                        value={`${usage.cached_tokens.toLocaleString()} tokens`}
                      />
                    )}
                    {n_ctx && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <span>利用率</span>
                          <span className={`font-mono ${textColor}`}>
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full ${barColor}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                          実用帯の目安: 〜16K 安全 / 〜32K 注意 / 32K+ 危険。Gemma
                          4 E4B は宣言上 128K だが、実用品質はそれ以下で劣化します。
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">
                    （まだ LLM を呼び出していません）
                  </div>
                )}
              </dl>
            ) : (
              <div className="text-red-600 dark:text-red-400">
                llama.cpp に接続できません。
                {info?.error && (
                  <div className="text-xs mt-1 opacity-80">{info.error}</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd
        className={`text-right truncate ${mono ? "font-mono" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1024) {
    return `${(n / 1024).toFixed(1)}K`;
  }
  return n.toString();
}
