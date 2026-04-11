"use client";

import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import type { FileTreeNode } from "@/lib/agent/executor";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";

export interface WorkspacePanelHandle {
  refresh: () => void;
  reset: () => void;
}

type TabKey = "workspace" | "attached";

interface WorkspacePanelProps {
  attachedRoot: string | null;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

export const WorkspacePanel = forwardRef<
  WorkspacePanelHandle,
  WorkspacePanelProps
>(function WorkspacePanel({ attachedRoot, activeTab, onChangeTab }, ref) {
  const [workspaceTree, setWorkspaceTree] = useState<FileTreeNode[]>([]);
  const [attachedTreeState, setAttachedTreeState] = useState<FileTreeNode[]>(
    []
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");

  // 親（app/page.tsx）は detach 時に workspace タブへ戻すので、
  // ここで再フォールバックする必要はない。
  // `activeTab === "attached" && !attachedRoot` の組み合わせは発生しない想定。
  // - attachedRoot がない状態で @attached/ を指す selectedFile は無効化
  const effectiveSelectedFile =
    selectedFile && selectedFile.startsWith("@attached/") && !attachedRoot
      ? null
      : selectedFile;
  // - attachedRoot がない時の attachedTree は空扱い
  const attachedTree = attachedRoot ? attachedTreeState : [];

  // Workspace ツリー取得
  const fetchWorkspaceTree = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        setWorkspaceTree(await res.json());
      }
    } catch {
      // サイレントに失敗
    }
  }, []);

  // Attached ツリー取得（attachedRoot 引数をとる版）
  const fetchAttachedTreeFor = useCallback(
    async (root: string) => {
      try {
        const res = await fetch(
          `/api/workspace?root=attached&attachedRoot=${encodeURIComponent(root)}`
        );
        if (res.ok) {
          setAttachedTreeState(await res.json());
        }
      } catch {
        // サイレントに失敗
      }
    },
    []
  );

  const refreshAll = useCallback(() => {
    fetchWorkspaceTree();
    if (attachedRoot) {
      fetchAttachedTreeFor(attachedRoot);
    }
  }, [fetchWorkspaceTree, fetchAttachedTreeFor, attachedRoot]);

  const reset = useCallback(() => {
    setWorkspaceTree([]);
    setSelectedFile(null);
    setFileContent("");
    fetchWorkspaceTree();
  }, [fetchWorkspaceTree]);

  useImperativeHandle(
    ref,
    () => ({ refresh: refreshAll, reset }),
    [refreshAll, reset]
  );

  // 初回 Workspace 取得
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/workspace");
        if (!cancelled && res.ok) {
          setWorkspaceTree(await res.json());
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // attachedRoot 変更時の attached ツリー取得（ある時だけ）
  useEffect(() => {
    if (!attachedRoot) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/workspace?root=attached&attachedRoot=${encodeURIComponent(attachedRoot)}`
        );
        if (!cancelled && res.ok) {
          setAttachedTreeState(await res.json());
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attachedRoot]);

  const handleSelectFile = useCallback(
    async (relativePath: string) => {
      const fullPath =
        activeTab === "attached" ? `@attached/${relativePath}` : relativePath;
      setSelectedFile(fullPath);
      try {
        const attachedQuery =
          activeTab === "attached" && attachedRoot
            ? `&attachedRoot=${encodeURIComponent(attachedRoot)}`
            : "";
        const res = await fetch(
          `/api/workspace/file?path=${encodeURIComponent(fullPath)}${attachedQuery}`
        );
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content);
        } else {
          setFileContent("ファイルを読み込めませんでした");
        }
      } catch {
        setFileContent("ファイルを読み込めませんでした");
      }
    },
    [activeTab, attachedRoot]
  );

  const handleChangeTab = (tab: TabKey) => {
    if (tab === activeTab) return;
    onChangeTab(tab);
    setSelectedFile(null);
    setFileContent("");
  };

  const activeTree = activeTab === "attached" ? attachedTree : workspaceTree;
  const emptyMessage =
    activeTab === "attached"
      ? attachedRoot
        ? "Attached Directory は空です"
        : "Directory がアタッチされていません"
      : "ワークスペースは空です";

  return (
    <div className="flex flex-col h-full">
      {/* タブ */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => handleChangeTab("workspace")}
          className={`px-3 py-2 text-xs uppercase tracking-wider font-medium transition-colors ${
            activeTab === "workspace"
              ? "text-gray-900 dark:text-gray-100 border-b-2 border-blue-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => handleChangeTab("attached")}
          disabled={!attachedRoot}
          className={`px-3 py-2 text-xs uppercase tracking-wider font-medium transition-colors ${
            activeTab === "attached"
              ? "text-gray-900 dark:text-gray-100 border-b-2 border-purple-500"
              : attachedRoot
              ? "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          }`}
          title={
            attachedRoot
              ? `Attached: ${attachedRoot}`
              : "Header からディレクトリをアタッチしてください"
          }
        >
          📎 Attached
        </button>
        <div className="flex-1" />
        {activeTab === "workspace" && (
          <button
            onClick={() => fetch("/api/workspace/open", { method: "POST" })}
            className="mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Finder で開く"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm7.5-3.25a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0V4.06l-6.22 6.22a.75.75 0 1 1-1.06-1.06l6.22-6.22H12.5a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="overflow-y-auto p-2 border-b border-gray-200 dark:border-gray-700"
          style={{ maxHeight: "40%" }}
        >
          {activeTree.length === 0 ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 p-2 text-center">
              {emptyMessage}
            </div>
          ) : (
            <FileTree nodes={activeTree} onSelectFile={handleSelectFile} />
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {effectiveSelectedFile ? (
            <FileViewer
              key={effectiveSelectedFile}
              path={effectiveSelectedFile}
              content={fileContent}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-gray-500">
              ファイルを選択して内容を表示
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
