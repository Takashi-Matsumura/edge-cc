"use client";

import { useState, useCallback, useRef } from "react";
import type { Message, AgentEvent, ToolResult } from "@/lib/agent/types";
import { MessageList, type DisplayMessage } from "./message-list";
import { InputBar } from "./input-bar";

interface ChatContainerProps {
  onStatusChange: (status: "idle" | "thinking" | "executing") => void;
  onWorkspaceUpdate: () => void;
}

export function ChatContainer({
  onStatusChange,
  onWorkspaceUpdate,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const historyRef = useRef<Message[]>([]);
  const idCounter = useRef(0);

  const nextId = () => String(++idCounter.current);

  const sendMessage = useCallback(
    async (text: string) => {
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
        historyRef.current.push({ role: "user", content: text });
        if (currentAssistantText) {
          historyRef.current.push({
            role: "assistant",
            content: currentAssistantText,
            tool_calls: undefined,
          });
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
    [onStatusChange, onWorkspaceUpdate]
  );

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <InputBar onSend={sendMessage} disabled={isRunning} />
    </div>
  );
}
