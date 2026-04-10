"use client";

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import type { FileTreeNode } from "@/lib/agent/executor";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";

export interface WorkspacePanelHandle {
  refresh: () => void;
  reset: () => void;
}

export const WorkspacePanel = forwardRef<WorkspacePanelHandle>(
  function WorkspacePanel(_, ref) {
    const [tree, setTree] = useState<FileTreeNode[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>("");

    const fetchTree = useCallback(async () => {
      try {
        const res = await fetch("/api/workspace");
        if (res.ok) {
          setTree(await res.json());
        }
      } catch {
        // サイレントに失敗
      }
    }, []);

    const reset = useCallback(() => {
      setTree([]);
      setSelectedFile(null);
      setFileContent("");
      fetchTree();
    }, [fetchTree]);

    useImperativeHandle(ref, () => ({ refresh: fetchTree, reset }), [fetchTree, reset]);

    useEffect(() => {
      fetchTree();
    }, [fetchTree]);

    const handleSelectFile = useCallback(async (path: string) => {
      setSelectedFile(path);
      try {
        const res = await fetch(
          `/api/workspace/file?path=${encodeURIComponent(path)}`
        );
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content);
        }
      } catch {
        setFileContent("ファイルを読み込めませんでした");
      }
    }, []);

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <span className="uppercase tracking-wider">Workspace</span>
          <button
            onClick={() => fetch("/api/workspace/open", { method: "POST" })}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Finder で開く"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.5-3.25a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0V4.06l-6.22 6.22a.75.75 0 1 1-1.06-1.06l6.22-6.22H12.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="overflow-y-auto p-2 border-b border-gray-200 dark:border-gray-700" style={{ maxHeight: "40%" }}>
            {tree.length === 0 ? (
              <div className="text-xs text-gray-400 dark:text-gray-500 p-2 text-center">
                ワークスペースは空です
              </div>
            ) : (
              <FileTree nodes={tree} onSelectFile={handleSelectFile} />
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedFile ? (
              <FileViewer path={selectedFile} content={fileContent} />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-gray-500">
                ファイルを選択して内容を表示
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
