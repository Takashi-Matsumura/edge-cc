import { promises as fs } from "fs";
import path from "path";
import type { ToolCall, ToolResult } from "./types";
import { execAsync } from "@/lib/utils/exec";
import { requireString, optionalString } from "@/lib/utils/validate";

export const WORKSPACE_ROOT = "/tmp/edge-cc-workspace/";

async function ensureWorkspace() {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
}

function resolveSafePath(relativePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, relativePath);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error("パスがワークスペース外を指しています");
  }
  return resolved;
}

const DANGEROUS_COMMANDS = [/rm\s+-rf\s+\//, /sudo/, /mkfs/, /dd\s+if=/];

async function readFile(args: Record<string, unknown>): Promise<string> {
  const filePath = resolveSafePath(requireString(args.path, "path"));
  return await fs.readFile(filePath, "utf-8");
}

async function writeFile(args: Record<string, unknown>): Promise<string> {
  const filePath = resolveSafePath(requireString(args.path, "path"));
  const content = requireString(args.content, "content");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  return `ファイルを書き込みました: ${args.path}`;
}

async function listFiles(args: Record<string, unknown>): Promise<string> {
  const dirPath = resolveSafePath(optionalString(args.path, "."));
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  if (entries.length === 0) return "(空のディレクトリ)";
  return entries
    .map((e) => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`)
    .join("\n");
}

async function runCommand(args: Record<string, unknown>): Promise<string> {
  const command = requireString(args.command, "command");

  for (const pattern of DANGEROUS_COMMANDS) {
    if (pattern.test(command)) {
      throw new Error("このコマンドは安全上の理由で実行できません");
    }
  }

  const result = await execAsync(command, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env, HOME: WORKSPACE_ROOT },
  });

  if (result.isError) {
    throw new Error(`コマンド実行エラー: ${result.output}`);
  }
  return result.output;
}

async function searchFiles(args: Record<string, unknown>): Promise<string> {
  const pattern = requireString(args.pattern, "pattern");
  const searchPath = resolveSafePath(optionalString(args.path, "."));
  const results: string[] = [];

  async function searchDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        await searchDir(fullPath);
      } else {
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(pattern)) {
              const relPath = path.relative(WORKSPACE_ROOT, fullPath);
              results.push(`${relPath}:${i + 1}: ${lines[i].trim()}`);
            }
          }
        } catch {
          // バイナリファイル等は無視
        }
      }
    }
  }

  await searchDir(searchPath);
  if (results.length === 0) return `"${pattern}" に一致する結果はありません`;
  return results.slice(0, 50).join("\n");
}

const TOOL_HANDLERS: Record<
  string,
  (args: Record<string, unknown>) => Promise<string>
> = {
  read_file: readFile,
  write_file: writeFile,
  list_files: listFiles,
  run_command: runCommand,
  search_files: searchFiles,
};

export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  await ensureWorkspace();

  try {
    const handler = TOOL_HANDLERS[toolCall.name];
    if (!handler) {
      return {
        tool_call_id: toolCall.id,
        content: `不明なツール: ${toolCall.name}`,
        is_error: true,
      };
    }
    const content = await handler(toolCall.arguments);
    return { tool_call_id: toolCall.id, content, is_error: false };
  } catch (error) {
    return {
      tool_call_id: toolCall.id,
      content: `エラー: ${error instanceof Error ? error.message : String(error)}`,
      is_error: true,
    };
  }
}

export interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export async function getWorkspaceTree(
  dir: string = WORKSPACE_ROOT
): Promise<FileTreeNode[]> {
  await ensureWorkspace();
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nodes: FileTreeNode[] = [];
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const node: FileTreeNode = {
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
      };
      if (entry.isDirectory()) {
        node.children = await getWorkspaceTree(path.join(dir, entry.name));
      }
      nodes.push(node);
    }
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}
