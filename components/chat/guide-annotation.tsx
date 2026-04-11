import type { GuideEvent } from "@/lib/agent/types";

interface GuideAnnotationProps {
  event: GuideEvent;
}

const PHASE_LABELS: Record<GuideEvent["phase"], string> = {
  loop_start: "ループ開始",
  loop_continue: "ループ継続",
  tool_choice: "ツール選択",
  tool_result: "実行結果の解釈",
  loop_end: "ループ終了",
  plan_start: "計画立案開始",
  plan_generated: "計画生成完了",
};

export function GuideAnnotation({ event }: GuideAnnotationProps) {
  const label = PHASE_LABELS[event.phase];

  return (
    <div className="relative ml-2 mr-4 my-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 overflow-hidden">
      {/* ヘッダーバー */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 border-b border-indigo-200 dark:border-indigo-800">
        {/* ガイドバッジ */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold tracking-wider uppercase">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.58a.75.75 0 0 1-1.12.814L8 12.09l-3.136 1.91a.75.75 0 0 1-1.12-.814l.852-3.58-2.79-2.39a.75.75 0 0 1 .427-1.317l3.664-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z" />
          </svg>
          ガイド
        </span>
        <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
          {label}
        </span>
        {event.iteration != null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono">
            #{event.iteration}
          </span>
        )}
      </div>
      {/* 本文 */}
      <div className="px-3 py-2.5 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
        {event.content}
      </div>
    </div>
  );
}
