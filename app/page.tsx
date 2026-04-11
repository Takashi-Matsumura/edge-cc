"use client";

import { useState, useRef, useCallback } from "react";
import { Header } from "@/components/layout/header";
import {
  ChatContainer,
  type ChatContainerHandle,
} from "@/components/chat/chat-container";
import {
  WorkspacePanel,
  type WorkspacePanelHandle,
} from "@/components/workspace/workspace-panel";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "thinking" | "executing">(
    "idle"
  );
  const [guideMode, setGuideMode] = useState(false);
  const [planMode, setPlanMode] = useState(false);
  const workspaceRef = useRef<WorkspacePanelHandle>(null);
  const chatRef = useRef<ChatContainerHandle>(null);

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
      <Header status={status} onClearWorkspace={handleClearWorkspace} guideMode={guideMode} onToggleGuide={() => setGuideMode((g) => !g)} />
      <div className="flex flex-1 min-h-0">
        <div className="flex-[3] min-w-0 border-r border-gray-200 dark:border-gray-700">
          <ChatContainer
            ref={chatRef}
            onStatusChange={setStatus}
            onWorkspaceUpdate={handleWorkspaceUpdate}
            guideMode={guideMode}
            planMode={planMode}
            onTogglePlanMode={() => setPlanMode((p) => !p)}
          />
        </div>
        <div className="flex-[2] min-w-0 hidden md:flex flex-col">
          <WorkspacePanel ref={workspaceRef} />
        </div>
      </div>
    </div>
  );
}
