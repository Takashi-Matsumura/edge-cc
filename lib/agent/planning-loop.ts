import type { Message, AgentEvent, ToolCall } from "./types";
import { callLLM } from "@/lib/llm/client";
import { readOnlyToolDefinitions } from "./tools";
import { executeTool } from "./executor";
import {
  planningSystemPrompt,
  extractPlanFromText,
} from "./planning-prompt";
import {
  guideForPlanningStart,
  guideForPlanGenerated,
} from "./planning-guide";

const DEFAULT_MAX_ITERATIONS = 8;

export interface PlanningLoopOptions {
  guideMode?: boolean;
  maxIterations?: number;
  attachedRoot?: string;
}

export async function* runPlanningLoop(
  userMessage: string,
  history: Message[],
  options: PlanningLoopOptions = {}
): AsyncGenerator<AgentEvent> {
  const {
    guideMode = false,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    attachedRoot,
  } = options;

  const messages: Message[] = [
    { role: "system", content: planningSystemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  yield { type: "plan_started" };
  if (guideMode) {
    yield guideForPlanningStart();
  }

  for (let i = 0; i < maxIterations; i++) {
    let response;
    try {
      response = await callLLM(messages, readOnlyToolDefinitions);
    } catch (error) {
      yield {
        type: "error",
        message: `LLMエラー: ${error instanceof Error ? error.message : String(error)}`,
      };
      yield { type: "done" };
      return;
    }

    // テキスト応答から計画を抽出できるか試す
    const plan = extractPlanFromText(response.text);
    if (plan) {
      // <PLAN> の外側の前置テキストがあれば先に流す
      if (response.text) {
        const preface = response.text
          .replace(/<PLAN>[\s\S]*?<\/PLAN>/i, "")
          .trim();
        if (preface) {
          yield { type: "assistant_text", content: preface };
        }
      }
      if (guideMode) {
        yield guideForPlanGenerated();
      }
      yield { type: "plan_generated", plan };
      yield { type: "done" };
      return;
    }

    // 計画はまだ。通常のテキストがあれば流す（調査中の独り言）
    if (response.text) {
      yield { type: "assistant_text", content: response.text };
    }

    // ツール呼び出しもテキストもなければ、LLM が計画を作れなかった
    if (response.toolCalls.length === 0) {
      if (!response.text) {
        yield {
          type: "assistant_text",
          content: "（計画を生成できませんでした）",
        };
      }
      yield {
        type: "error",
        message:
          "LLM が実行計画を生成できませんでした。プロンプトを明確にしてもう一度お試しください。",
      };
      yield { type: "done" };
      return;
    }

    // アシスタントメッセージを履歴に追加（runAgentLoop と同じ形式）
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

    // 各ツールを planning モードで実行
    for (const toolCall of response.toolCalls) {
      yield { type: "tool_call", tool_call: toolCall };

      const result = await executeTool(toolCall, {
        mode: "planning",
        attachedRoot,
      });
      yield { type: "tool_result", result };

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.content,
      });
    }
  }

  yield {
    type: "error",
    message: `計画フェーズが最大試行数（${maxIterations}回）に達しました。計画は生成されませんでした。`,
  };
  yield { type: "done" };
}
