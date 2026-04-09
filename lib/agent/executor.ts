import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import type { ToolCall, ToolResult } from "./types";

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

async function readFile(args: Record<string, unknown>): Promise<string> {
  const filePath = resolveSafePath(args.path as string);
  const content = await fs.readFile(filePath, "utf-8");
  return content;
}

async function writeFile(args: Record<string, unknown>): Promise<string> {
  const filePath = resolveSafePath(args.path as string);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, args.content as string, "utf-8");
  return `ファイルを書き込みました: ${args.path}`;
}

async function listFiles(args: Record<string, unknown>): Promise<string> {
  const dirPath = resolveSafePath((args.path as string) || ".");
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  if (entries.length === 0) return "(空のディレクトリ)";
  return entries
    .map((e) => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`)
    .join("\n");
}

async function runCommand(args: Record<string, unknown>): Promise<string> {
  const command = args.command as string;

  // 危険なコマンドのブロック
  const dangerous = [/rm\s+-rf\s+\//, /sudo/, /mkfs/, /dd\s+if=/];
  for (const pattern of dangerous) {
    if (pattern.test(command)) {
      throw new Error("このコマンドは安全上の理由で実行できません");
    }
  }

  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        cwd: WORKSPACE_ROOT,
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, HOME: WORKSPACE_ROOT },
      },
      (error, stdout, stderr) => {
        if (error && !stdout && !stderr) {
          reject(new Error(`コマンド実行エラー: ${error.message}`));
          return;
        }
        const output = [stdout, stderr].filter(Boolean).join("\n");
        resolve(output || "(出力なし)");
      }
    );
  });
}

async function searchFiles(args: Record<string, unknown>): Promise<string> {
  const pattern = args.pattern as string;
  const searchPath = resolveSafePath((args.path as string) || ".");
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

export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  await ensureWorkspace();

  try {
    let content: string;
    switch (toolCall.name) {
      case "read_file":
        content = await readFile(toolCall.arguments);
        break;
      case "write_file":
        content = await writeFile(toolCall.arguments);
        break;
      case "list_files":
        content = await listFiles(toolCall.arguments);
        break;
      case "run_command":
        content = await runCommand(toolCall.arguments);
        break;
      case "search_files":
        content = await searchFiles(toolCall.arguments);
        break;
      default:
        content = `不明なツール: ${toolCall.name}`;
    }
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
