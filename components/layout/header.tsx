"use client";

interface HeaderProps {
  status: "idle" | "thinking" | "executing";
  onClearWorkspace: () => void;
}

export function Header({ status, onClearWorkspace }: HeaderProps) {
  const statusLabels = {
    idle: "待機中",
    thinking: "思考中...",
    executing: "ツール実行中...",
  };
  const statusColors = {
    idle: "bg-gray-400",
    thinking: "bg-yellow-400 animate-pulse",
    executing: "bg-green-400 animate-pulse",
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight">
          edge-cc
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
          自律型コーディングエージェント デモ
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span
            className={`inline-block w-2 h-2 rounded-full ${statusColors[status]}`}
          />
          {statusLabels[status]}
        </div>
        <button
          onClick={onClearWorkspace}
          className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          WS リセット
        </button>
      </div>
    </header>
  );
}
