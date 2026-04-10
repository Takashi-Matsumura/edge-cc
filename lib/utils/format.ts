import type { ToolCall } from "@/lib/agent/types";

/**
 * ツールの引数を人間が読みやすい形式にフォーマットする。
 * guide.ts と tool-call-card.tsx の両方から使用。
 */
export function formatToolArgs(tc: ToolCall): string {
  const args = tc.arguments;
  switch (tc.name) {
    case "read_file":
      return String(args.path || "");
    case "write_file":
      return String(args.path || "");
    case "list_files":
      return String(args.path || ".");
    case "run_command":
      return String(args.command || "");
    case "search_files":
      return `"${args.pattern}" in ${args.path || "."}`;
    default:
      return JSON.stringify(args);
  }
}
