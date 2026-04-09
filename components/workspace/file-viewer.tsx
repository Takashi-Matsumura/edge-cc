interface FileViewerProps {
  path: string;
  content: string;
}

export function FileViewer({ path, content }: FileViewerProps) {
  const lines = content.split("\n");

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 truncate">
        {path}
      </div>
      <pre className="flex-1 overflow-auto text-xs p-2 font-mono">
        {lines.map((line, i) => (
          <div key={i} className="flex">
            <span className="w-8 text-right pr-2 text-gray-400 select-none shrink-0">
              {i + 1}
            </span>
            <span className="break-all">{line}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
