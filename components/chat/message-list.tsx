"use client";

import { useEffect, useRef } from "react";
import type { ToolCall, ToolResult } from "@/lib/agent/types";
import { MessageBubble } from "./message-bubble";
import { ToolCallCard } from "./tool-call-card";

export interface DisplayMessage {
  id: string;
  type: "user" | "assistant" | "tool_call";
  content?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

interface MessageListProps {
  messages: DisplayMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 p-8">
        <div className="text-center">
          <p className="text-lg mb-2">edge-cc エージェント</p>
          <p className="text-sm">
            このエージェントは、チャットAIと違い、
            <br />
            ツールを使って自律的にタスクを実行します。
          </p>
          <p className="text-sm mt-2">
            下の入力欄から指示を送ってみてください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => {
        if (msg.type === "tool_call" && msg.toolCall) {
          return (
            <ToolCallCard
              key={msg.id}
              toolCall={msg.toolCall}
              result={msg.toolResult}
            />
          );
        }
        if (msg.type === "user" || msg.type === "assistant") {
          return (
            <MessageBubble
              key={msg.id}
              role={msg.type}
              content={msg.content || ""}
            />
          );
        }
        return null;
      })}
      <div ref={bottomRef} />
    </div>
  );
}
