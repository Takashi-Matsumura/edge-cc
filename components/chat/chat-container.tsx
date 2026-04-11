"use client";

import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import type {
  Message,
  AgentEvent,
  ToolResult,
  PlanPayload,
} from "@/lib/agent/types";
import { buildApprovedPlanMessage } from "@/lib/agent/planning-prompt";
import { MessageList, type DisplayMessage } from "./message-list";
import { InputBar } from "./input-bar";

export interface ChatContainerHandle {
  reset: () => void;
}

interface ChatContainerProps {
  onStatusChange: (status: "idle" | "thinking" | "executing") => void;
  onWorkspaceUpdate: () => void;
  guideMode: boolean;
  planMode: boolean;
  onTogglePlanMode: () => void;
  attachedRoot: string | null;
}

interface SendMessageOptions {
  forcePlanMode?: boolean;
}

export const ChatContainer = forwardRef<ChatContainerHandle, ChatContainerProps>(
function ChatContainer({
  onStatusChange,
  onWorkspaceUpdate,
  guideMode,
  planMode,
  onTogglePlanMode,
  attachedRoot,
}, ref) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const historyRef = useRef<Message[]>([]);
  const idCounter = useRef(0);
  // 承認ハンドラ等から最新メッセージ配列を参照するためのミラー
  const messagesRef = useRef<DisplayMessage[]>([]);
  messagesRef.current = messages;

  const nextId = () => String(++idCounter.current);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setMessages([]);
      historyRef.current = [];
    },
  }), []);

  const sendMessage = useCallback(
    async (text: string, opts: SendMessageOptions = {}) => {
      // forcePlanMode が明示的に false ならそれを優先（承認後の通常モード再送）
      const effectivePlanMode =
        opts.forcePlanMode === false ? false : planMode;

      setIsRunning(true);
      onStatusChange("thinking");

      // ユーザーメッセージを追加
      const userMsg: DisplayMessage = {
        id: nextId(),
        type: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: historyRef.current,
            guideMode,
            planMode: effectivePlanMode,
            attachedRoot,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`API error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentAssistantId: string | null = null;
        let currentAssistantText = "";
        // Plan Mode で計画が生成されたかフラグ。生成時は履歴に積まず、承認時に処理する。
        let planGeneratedInThisRun = false;

        // ツールコールIDからDisplayMessage IDへのマップ
        const toolCallMsgIds = new Map<string, string>();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            let event: AgentEvent;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              continue;
            }

            switch (event.type) {
              case "guide": {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: nextId(),
                    type: "guide",
                    guideEvent: event,
                  },
                ]);
                break;
              }
              case "assistant_text": {
                onStatusChange("thinking");
                if (!currentAssistantId) {
                  currentAssistantId = nextId();
                  currentAssistantText = event.content;
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: currentAssistantId!,
                      type: "assistant",
                      content: event.content,
                    },
                  ]);
                } else {
                  currentAssistantText += event.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === currentAssistantId
                        ? { ...m, content: currentAssistantText }
                        : m
                    )
                  );
                }
                break;
              }
              case "tool_call": {
                onStatusChange("executing");
                // 新しいツール呼び出しが来たらアシスタントテキストをリセット
                currentAssistantId = null;
                currentAssistantText = "";

                const msgId = nextId();
                toolCallMsgIds.set(event.tool_call.id, msgId);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: msgId,
                    type: "tool_call",
                    toolCall: event.tool_call,
                  },
                ]);
                break;
              }
              case "tool_result": {
                onStatusChange("thinking");
                const tcMsgId = toolCallMsgIds.get(
                  event.result.tool_call_id
                );
                if (tcMsgId) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === tcMsgId
                        ? { ...m, toolResult: event.result as ToolResult }
                        : m
                    )
                  );
                }
                break;
              }
              case "plan_started": {
                // 計画立案フェーズ開始。現状特別な UI 更新はなし。
                currentAssistantId = null;
                currentAssistantText = "";
                break;
              }
              case "plan_generated": {
                // 計画カードを追加（承認待ち）
                currentAssistantId = null;
                currentAssistantText = "";
                planGeneratedInThisRun = true;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: nextId(),
                    type: "plan",
                    plan: event.plan,
                    planStatus: "pending",
                  },
                ]);
                break;
              }
              case "done": {
                onWorkspaceUpdate();
                break;
              }
              case "error": {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: nextId(),
                    type: "assistant",
                    content: `エラー: ${event.message}`,
                  },
                ]);
                break;
              }
            }
          }
        }

        // 会話履歴を更新（次回リクエスト用）
        // Plan Mode で計画が生成された場合は、承認/却下の判断前なので履歴には積まない。
        // 承認されれば approvePlan ハンドラ経由で通常モードの新規リクエストとして
        // 計画本文が送信され、その時点で履歴に追加される。
        if (!planGeneratedInThisRun) {
          historyRef.current.push({ role: "user", content: text });
          if (currentAssistantText) {
            historyRef.current.push({
              role: "assistant",
              content: currentAssistantText,
              tool_calls: undefined,
            });
          }
        }
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            type: "assistant",
            content: `接続エラー: ${error instanceof Error ? error.message : "不明なエラー"}。llama.cppが起動しているか確認してください。`,
          },
        ]);
      } finally {
        setIsRunning(false);
        onStatusChange("idle");
      }
    },
    [onStatusChange, onWorkspaceUpdate, guideMode, planMode, attachedRoot]
  );

  const approvePlan = useCallback(
    (msgId: string) => {
      const target = messagesRef.current.find((m) => m.id === msgId);
      if (
        !target ||
        target.type !== "plan" ||
        target.planStatus !== "pending" ||
        !target.plan
      ) {
        return;
      }
      const plan: PlanPayload = target.plan;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, planStatus: "approved" } : m
        )
      );
      // 通常モードで承認メッセージを再送
      sendMessage(buildApprovedPlanMessage(plan), { forcePlanMode: false });
    },
    [sendMessage]
  );

  const rejectPlan = useCallback((msgId: string) => {
    const target = messagesRef.current.find((m) => m.id === msgId);
    if (
      !target ||
      target.type !== "plan" ||
      target.planStatus !== "pending"
    ) {
      return;
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, planStatus: "rejected" } : m
      )
    );
    // historyRef には何も追加しない（元ユーザー発話も破棄）
  }, []);

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        onApprovePlan={approvePlan}
        onRejectPlan={rejectPlan}
      />
      <InputBar
        onSend={sendMessage}
        disabled={isRunning}
        planMode={planMode}
        onTogglePlanMode={onTogglePlanMode}
      />
    </div>
  );
});
