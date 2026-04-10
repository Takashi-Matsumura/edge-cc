"use client";

import { useState, useCallback } from "react";

interface FileViewerProps {
  path: string;
  content: string;
}

const RUNNABLE_EXTENSIONS = new Set([".py", ".js", ".ts", ".sh", ".rb", ".pl", ".php"]);

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot).toLowerCase() : "";
}

export function FileViewer({ path, content }: FileViewerProps) {
  const lines = content.split("\n");
  const ext = getExtension(path);
  const canRun = RUNNABLE_EXTENSIONS.has(ext);

  const [runState, setRunState] = useState<{
    status: "idle" | "running" | "done";
    command?: string;
    output?: string;
    isError?: boolean;
  }>({ status: "idle" });

  const handleRun = useCallback(async () => {
    setRunState({ status: "running" });
    try {
      const res = await fetch("/api/workspace/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      setRunState({
        status: "done",
        command: data.command,
        output: data.output || data.error,
        isError: data.isError || !res.ok,
      });
    } catch (err) {
      setRunState({
        status: "done",
        output: `実行エラー: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      });
    }
  }, [path]);

  return (
    <div className="flex flex-col h-full">
      {/* ファイルパス + 実行ボタン */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <span className="truncate">{path}</span>
        {canRun && (
          <button
            onClick={handleRun}
            disabled={runState.status === "running"}
            className="flex items-center gap-1 ml-2 shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {runState.status === "running" ? (
              <>
                <span className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                実行中...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.267a1.5 1.5 0 0 1 0 2.531l-6.706 4.268A1.5 1.5 0 0 1 3 12.267V3.732Z" />
                </svg>
                実行
              </>
            )}
          </button>
        )}
      </div>

      {/* コードエリア + 実行結果を均等分割 */}
      <div className={`flex-1 flex flex-col min-h-0 ${runState.status !== "idle" ? "" : ""}`}>
        <pre className={`overflow-auto text-xs p-2 font-mono min-h-0 ${runState.status !== "idle" ? "flex-1 basis-1/2" : "flex-1"}`}>
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-8 text-right pr-2 text-gray-400 select-none shrink-0">
                {i + 1}
              </span>
              <span className="break-all">{line}</span>
            </div>
          ))}
        </pre>

        {runState.status !== "idle" && (
          <div className="flex-1 basis-1/2 flex flex-col min-h-0 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-3 py-1 bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
              <span className="font-medium uppercase tracking-wider">Output</span>
              {runState.command && (
                <code className="font-mono truncate ml-2">{runState.command}</code>
              )}
            </div>
            <pre
              className={`flex-1 text-xs p-2 font-mono overflow-auto min-h-0 ${
                runState.isError
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                  : "bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
              }`}
            >
              {runState.status === "running" ? "実行中..." : runState.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
