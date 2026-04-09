import type { Message, AgentEvent, ToolCall } from "./types";
import { callLLM } from "@/lib/llm/client";
import { toolDefinitions } from "./tools";
import { executeTool } from "./executor";
import { systemPrompt } from "./system-prompt";

const MAX_ITERATIONS = 15;

export async function* runAgentLoop(
  userMessage: string,
  history: Message[]
): AsyncGenerator<AgentEvent> {
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response;
    try {
      response = await callLLM(messages, toolDefinitions);
    } catch (error) {
      yield {
        type: "error",
        message: `LLMエラー: ${error instanceof Error ? error.message : String(error)}`,
      };
      return;
    }

    // テキスト応答がある場合
    if (response.text) {
      yield { type: "assistant_text", content: response.text };
    }

    // ツール呼び出しがない場合、エージェントループ終了
    if (response.toolCalls.length === 0) {
      // テキストもなかった場合のフォールバック
      if (!response.text) {
        yield {
          type: "assistant_text",
          content: "（応答を生成できませんでした）",
        };
      }
      yield { type: "done" };
      return;
    }

    // アシスタントメッセージを履歴に追加
    const assistantMessage: Message = {
      role: "assistant",
      content: response.text,
      tool_calls: response.toolCalls.map((tc: ToolCall) => ({
        id: tc.id,
        type: "function" as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        },
      })),
    };
    messages.push(assistantMessage);

    // 各ツールを実行
    for (const toolCall of response.toolCalls) {
      yield { type: "tool_call", tool_call: toolCall };

      const result = await executeTool(toolCall);
      yield { type: "tool_result", result };

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.content,
      });
    }

    // 次のイテレーションでLLMを再度呼び出す
  }

  yield {
    type: "assistant_text",
    content: "最大イテレーション数に達しました。タスクを中断します。",
  };
  yield { type: "done" };
}
