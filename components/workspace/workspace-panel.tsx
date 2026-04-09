"use client";

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import type { FileTreeNode } from "@/lib/agent/executor";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";

export interface WorkspacePanelHandle {
  refresh: () => void;
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

    useImperativeHandle(ref, () => ({ refresh: fetchTree }), [fetchTree]);

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
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 uppercase tracking-wider">
          Workspace
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
