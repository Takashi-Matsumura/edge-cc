import type { GuideEvent } from "@/lib/agent/types";

interface GuideAnnotationProps {
  event: GuideEvent;
}

const PHASE_COLORS: Record<GuideEvent["phase"], string> = {
  loop_start: "border-indigo-400 dark:border-indigo-500",
  loop_continue: "border-indigo-400 dark:border-indigo-500",
  tool_choice: "border-amber-400 dark:border-amber-500",
  tool_result: "border-green-400 dark:border-green-500",
  loop_end: "border-gray-400 dark:border-gray-500",
};

const PHASE_LABELS: Record<GuideEvent["phase"], string> = {
  loop_start: "ループ開始",
  loop_continue: "ループ継続",
  tool_choice: "ツール選択",
  tool_result: "実行結果の解釈",
  loop_end: "ループ終了",
};

export function GuideAnnotation({ event }: GuideAnnotationProps) {
  const borderColor = PHASE_COLORS[event.phase];
  const label = PHASE_LABELS[event.phase];

  return (
    <div className={`relative ml-2 mr-4 my-3 border-l-4 ${borderColor} bg-slate-50 dark:bg-slate-800/60 rounded-r-lg overflow-hidden`}>
      {/* ヘッダーバー */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400">
          <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          ガイド
        </span>
        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {event.iteration != null && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-mono">
            #{event.iteration}
          </span>
        )}
      </div>
      {/* 本文 */}
      <div className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {event.content}
      </div>
    </div>
  );
}
