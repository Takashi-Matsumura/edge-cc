"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { AttachModal } from "@/components/layout/attach-modal";
import type { LLMInfo } from "@/components/layout/context-badge";
import type { LLMUsage } from "@/lib/agent/types";
import {
  ChatContainer,
  type ChatContainerHandle,
} from "@/components/chat/chat-container";
import {
  WorkspacePanel,
  type WorkspacePanelHandle,
} from "@/components/workspace/workspace-panel";

const ATTACHED_ROOT_KEY = "edge-cc.attachedRoot";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "thinking" | "executing">(
    "idle"
  );
  const [guideMode, setGuideMode] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const [attachedRoot, setAttachedRoot] = useState<string | null>(null);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [llmInfo, setLlmInfo] = useState<LLMInfo | null>(null);
  const [llmUsage, setLlmUsage] = useState<LLMUsage | null>(null);
  // WorkspacePanel の現在タブ。ChatContainer/InputBar のサンプル切り替えにも使う
  // ため、親でホールドして下ろす。
  const [workspaceTab, setWorkspaceTab] = useState<"workspace" | "attached">(
    "workspace"
  );
  const workspaceRef = useRef<WorkspacePanelHandle>(null);
  const chatRef = useRef<ChatContainerHandle>(null);

  // 起動時に llama.cpp の情報を取得。失敗しても UI は崩れない。
  useEffect(() => {
    fetch("/api/llm/info")
      .then((r) => r.json())
      .then((data: LLMInfo) => setLlmInfo(data))
      .catch((err) =>
        setLlmInfo({
          available: false,
          error: err instanceof Error ? err.message : String(err),
        })
      );
  }, []);

  // localStorage から初期値を読み込む。
  // SSR 時は window が無いため useEffect 内で読み込むのが最も安全。
  // React 19 の set-state-in-effect ルールには該当するが、localStorage からの
  // 初期ハイドレーションという用途に限っては例外とする。
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ATTACHED_ROOT_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAttachedRoot(stored);
      }
    } catch {
      // localStorage アクセス不可な環境では無視
    }
  }, []);

  const handleAttach = useCallback((normalizedPath: string) => {
    setAttachedRoot(normalizedPath);
    try {
      localStorage.setItem(ATTACHED_ROOT_KEY, normalizedPath);
    } catch {
      // ignore
    }
  }, []);

  const handleDetach = useCallback(() => {
    setAttachedRoot(null);
    // アタッチを解除したら ATTACHED タブは無効になるので workspace に戻す
    setWorkspaceTab("workspace");
    try {
      localStorage.removeItem(ATTACHED_ROOT_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleClearWorkspace = useCallback(async () => {
    await fetch("/api/workspace", { method: "DELETE" });
    chatRef.current?.reset();
    workspaceRef.current?.reset();
  }, []);

  const handleWorkspaceUpdate = useCallback(() => {
    workspaceRef.current?.refresh();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Header
        status={status}
        onClearWorkspace={handleClearWorkspace}
        guideMode={guideMode}
        onToggleGuide={() => setGuideMode((g) => !g)}
        attachedRoot={attachedRoot}
        onOpenAttachModal={() => setAttachModalOpen(true)}
        llmInfo={llmInfo}
        llmUsage={llmUsage}
      />
      <div className="flex flex-1 min-h-0">
        <div className="flex-[3] min-w-0 border-r border-gray-200 dark:border-gray-700">
          <ChatContainer
            ref={chatRef}
            onStatusChange={setStatus}
            onWorkspaceUpdate={handleWorkspaceUpdate}
            onUsageUpdate={setLlmUsage}
            guideMode={guideMode}
            planMode={planMode}
            onTogglePlanMode={() => setPlanMode((p) => !p)}
            attachedRoot={attachedRoot}
            workspaceTab={workspaceTab}
          />
        </div>
        <div className="flex-[2] min-w-0 hidden md:flex flex-col">
          <WorkspacePanel
            ref={workspaceRef}
            attachedRoot={attachedRoot}
            activeTab={workspaceTab}
            onChangeTab={setWorkspaceTab}
          />
        </div>
      </div>
      <AttachModal
        isOpen={attachModalOpen}
        currentPath={attachedRoot}
        onClose={() => setAttachModalOpen(false)}
        onAttach={handleAttach}
        onDetach={handleDetach}
      />
    </div>
  );
}
