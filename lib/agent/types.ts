export type ToolName =
  | "read_file"
  | "write_file"
  | "list_files"
  | "run_command"
  | "search_files";

export interface ToolCall {
  id: string;
  name: ToolName;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  tool_call_id: string;
  content: string;
  is_error: boolean;
}

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: {
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }[];
    }
  | { role: "tool"; tool_call_id: string; content: string };

export type GuideEvent = {
  type: "guide";
  phase: "tool_choice" | "tool_result" | "loop_continue" | "loop_start" | "loop_end";
  content: string;
  iteration?: number;
};

export type AgentEvent =
  | { type: "assistant_text"; content: string }
  | { type: "tool_call"; tool_call: ToolCall }
  | { type: "tool_result"; result: ToolResult }
  | GuideEvent
  | { type: "done" }
  | { type: "error"; message: string };
