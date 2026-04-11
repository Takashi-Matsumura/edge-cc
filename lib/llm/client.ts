import type { Message, ToolCall, ToolName } from "@/lib/agent/types";

const LLAMA_CPP_URL =
  process.env.LLAMA_CPP_URL || "http://localhost:8080";

interface OpenAIToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface LLMResponse {
  text: string | null;
  toolCalls: ToolCall[];
}

export async function callLLM(
  messages: Message[],
  tools: OpenAIToolDef[]
): Promise<LLMResponse> {
  const res = await fetch(`${LLAMA_CPP_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`llama.cpp API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error("No choices in llama.cpp response");
  }

  const message = choice.message;

  // 1. 構造化tool callingレスポンスがある場合
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCalls: ToolCall[] = message.tool_calls.map(
      (tc: { id: string; function: { name: string; arguments: string } }) => ({
        id: tc.id || crypto.randomUUID(),
        name: tc.function.name as ToolName,
        arguments: JSON.parse(tc.function.arguments),
      })
    );
    return { text: message.content || null, toolCalls };
  }

  // 2. テキストからtool callをパースするフォールバック
  const text: string = message.content || "";
  const parsed = parseToolCallsFromText(text);
  if (parsed.length > 0) {
    // ツール呼び出し部分を除いたテキストを返す
    const cleanedText = text
      .replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, "")
      .replace(/\{[\s]*"tool"[\s]*:[\s\S]*?\}/g, "")
      .trim();
    return {
      text: cleanedText || null,
      toolCalls: parsed,
    };
  }

  // 3. 通常のテキスト応答
  return { text, toolCalls: [] };
}

const VALID_TOOLS: Set<string> = new Set([
  "read_file",
  "write_file",
  "list_files",
  "run_command",
  "search_files",
  "scan_csproj",
]);

function parseToolCallsFromText(text: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];

  // ```json { "tool": "...", "arguments": {...} } ``` 形式
  const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const parsed = tryParseToolCall(match[1]);
    if (parsed) toolCalls.push(parsed);
  }

  if (toolCalls.length > 0) return toolCalls;

  // インラインJSON形式
  const jsonRegex = /\{[\s]*"tool"[\s]*:[\s]*"[^"]+?"[\s\S]*?\}/g;
  while ((match = jsonRegex.exec(text)) !== null) {
    const parsed = tryParseToolCall(match[0]);
    if (parsed) toolCalls.push(parsed);
  }

  return toolCalls;
}

function tryParseToolCall(jsonStr: string): ToolCall | null {
  try {
    const obj = JSON.parse(jsonStr);
    if (obj.tool && VALID_TOOLS.has(obj.tool) && obj.arguments) {
      return {
        id: crypto.randomUUID(),
        name: obj.tool as ToolName,
        arguments: obj.arguments,
      };
    }
  } catch {
    // パース失敗は無視
  }
  return null;
}
