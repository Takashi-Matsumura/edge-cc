import { promises as fs } from "fs";
import path from "path";
import type { ToolCall, ToolResult, ExecutionMode } from "./types";
import { execAsync } from "@/lib/utils/exec";
import { requireString, optionalString } from "@/lib/utils/validate";

export const WORKSPACE_ROOT = "/tmp/edge-cc-workspace/";
// 末尾スラッシュを除いた形。path.resolve の戻り値と比較するために使う。
const WORKSPACE_ROOT_NORMALIZED = path.resolve(WORKSPACE_ROOT);

// Attached Directory のパス接頭辞。`@attached/foo.cs` のように使う。
export const ATTACHED_PREFIX = "@attached";

// ツリー走査で無視するディレクトリ（大規模プロジェクトの肥大化対策）
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "bin",
  "obj",
  ".vs",
  ".idea",
  ".next",
]);

async function ensureWorkspace() {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
}

export interface ResolveContext {
  /** セッションで設定されている Attached Directory の絶対パス */
  attachedRoot?: string;
}

/**
 * Attached Directory 用のパス（`@attached/...`）かどうかを判定します。
 */
export function isAttachedPath(relativePath: string): boolean {
  return (
    relativePath === ATTACHED_PREFIX ||
    relativePath.startsWith(ATTACHED_PREFIX + "/")
  );
}

/**
 * 相対パスをワークスペースルート基準で絶対パスに解決します。
 * ワークスペース外を指すパス（`..` によるエスケープなど）は拒否します。
 *
 * `@attached/...` で始まるパスは Attached Directory（context.attachedRoot）
 * を基準に解決します。attachedRoot が未設定ならエラー。
 *
 * 実装メモ:
 * - `path.resolve("/tmp/edge-cc-workspace/", ".")` は末尾スラッシュのない
 *   `/tmp/edge-cc-workspace` を返すため、`startsWith(WORKSPACE_ROOT)` での
 *   比較は false になる。正規化したパスと厳密比較 + セパレータ付きで
 *   前方一致を取ることで修正している。
 * - セパレータ付き前方一致により `/tmp/edge-cc-workspace-evil` のような
 *   prefix-escape も同時に防いでいる。
 */
export function resolveSafePath(
  relativePath: string,
  context: ResolveContext = {}
): string {
  // Attached Directory 側のパス
  if (isAttachedPath(relativePath)) {
    if (!context.attachedRoot) {
      throw new Error(
        "Attached Directory が設定されていません。Header の「ディレクトリをアタッチ」から設定してください。"
      );
    }
    const rel =
      relativePath === ATTACHED_PREFIX
        ? "."
        : relativePath.slice(ATTACHED_PREFIX.length + 1);
    const rootNormalized = path.resolve(context.attachedRoot);
    const resolved = path.resolve(rootNormalized, rel);
    if (
      resolved !== rootNormalized &&
      !resolved.startsWith(rootNormalized + path.sep)
    ) {
      throw new Error("パスが Attached Directory 外を指しています");
    }
    return resolved;
  }

  // 従来の workspace ルート
  const resolved = path.resolve(WORKSPACE_ROOT, relativePath);
  if (
    resolved !== WORKSPACE_ROOT_NORMALIZED &&
    !resolved.startsWith(WORKSPACE_ROOT_NORMALIZED + path.sep)
  ) {
    throw new Error("パスがワークスペース外を指しています");
  }
  return resolved;
}

const DANGEROUS_COMMANDS = [/rm\s+-rf\s+\//, /sudo/, /mkfs/, /dd\s+if=/];

async function readFile(
  args: Record<string, unknown>,
  context: ResolveContext
): Promise<string> {
  const filePath = resolveSafePath(
    requireString(args.path, "path"),
    context
  );
  return await fs.readFile(filePath, "utf-8");
}

async function writeFile(
  args: Record<string, unknown>,
  context: ResolveContext
): Promise<string> {
  const relPath = requireString(args.path, "path");
  if (isAttachedPath(relPath)) {
    throw new Error(
      "write_file は Attached Directory には使用できません（read-only）"
    );
  }
  const filePath = resolveSafePath(relPath, context);
  const content = requireString(args.content, "content");
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  return `ファイルを書き込みました: ${args.path}`;
}

async function listFiles(
  args: Record<string, unknown>,
  context: ResolveContext
): Promise<string> {
  const dirPath = resolveSafePath(optionalString(args.path, "."), context);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  if (entries.length === 0) return "(空のディレクトリ)";
  return entries
    .map((e) => `${e.isDirectory() ? "📁" : "📄"} ${e.name}`)
    .join("\n");
}

async function runCommand(
  args: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: ResolveContext
): Promise<string> {
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

async function searchFiles(
  args: Record<string, unknown>,
  context: ResolveContext
): Promise<string> {
  const pattern = requireString(args.pattern, "pattern");
  const inputPath = optionalString(args.path, ".");
  const searchPath = resolveSafePath(inputPath, context);
  // 検索結果の相対パス基準（attached 検索なら attached ルートから）
  const baseForRel = isAttachedPath(inputPath)
    ? context.attachedRoot || WORKSPACE_ROOT
    : WORKSPACE_ROOT;
  const results: string[] = [];

  async function searchDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        await searchDir(fullPath);
      } else {
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(pattern)) {
              const relPath = path.relative(baseForRel, fullPath);
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

/**
 * .csproj ファイルを正規表現ベースでパースし、主要な情報を Markdown で返します。
 * SDK スタイル（`<Project Sdk="...">`）と従来スタイルのどちらもサポート。
 * 実ビルドはせず、XML から構造的に抽出するだけなので高速かつ依存ゼロ。
 */
async function scanCsproj(
  args: Record<string, unknown>,
  context: ResolveContext
): Promise<string> {
  const relPath = requireString(args.path, "path");
  if (!relPath.endsWith(".csproj")) {
    throw new Error(
      "指定されたファイルは .csproj ではありません。.csproj ファイルのパスを指定してください。"
    );
  }
  const filePath = resolveSafePath(relPath, context);
  const xml = await fs.readFile(filePath, "utf-8");
  const fileName = path.basename(filePath);

  // SDK 属性
  const sdkMatch = xml.match(/<Project[^>]*\bSdk\s*=\s*"([^"]+)"/);
  const sdk = sdkMatch ? sdkMatch[1] : null;

  // 単一タグ値の抽出ヘルパ
  const firstTag = (tag: string): string | null => {
    const re = new RegExp(`<${tag}>([^<]+)</${tag}>`);
    const m = xml.match(re);
    return m ? m[1].trim() : null;
  };

  const targetFramework = firstTag("TargetFramework");
  const targetFrameworks = firstTag("TargetFrameworks");
  const outputType = firstTag("OutputType");
  const rootNamespace = firstTag("RootNamespace");
  const assemblyName = firstTag("AssemblyName");
  const nullable = firstTag("Nullable");
  const langVersion = firstTag("LangVersion");
  const implicitUsings = firstTag("ImplicitUsings");

  // PackageReference: Include と Version を抽出
  // 形式: <PackageReference Include="..." Version="..." />
  //       <PackageReference Include="..." Version="..."></PackageReference>
  const packageMatches = [
    ...xml.matchAll(
      /<PackageReference\s+[^>]*Include\s*=\s*"([^"]+)"[^>]*Version\s*=\s*"([^"]+)"/g
    ),
  ];
  // Version 属性が無い PackageReference（中央パッケージ管理）も捕捉
  const packageNoVerMatches = [
    ...xml.matchAll(/<PackageReference\s+[^>]*Include\s*=\s*"([^"]+)"/g),
  ].filter(
    (m) => !packageMatches.some((pm) => pm[1] === m[1])
  );

  // ProjectReference
  const projectMatches = [
    ...xml.matchAll(/<ProjectReference\s+[^>]*Include\s*=\s*"([^"]+)"/g),
  ];

  // 出力を組み立て
  const lines: string[] = [];
  lines.push(`# プロジェクト: ${fileName}`);
  if (sdk) lines.push(`- SDK: ${sdk}`);
  if (targetFramework) lines.push(`- TargetFramework: ${targetFramework}`);
  if (targetFrameworks) lines.push(`- TargetFrameworks: ${targetFrameworks}`);
  if (outputType) lines.push(`- OutputType: ${outputType}`);
  if (rootNamespace) lines.push(`- RootNamespace: ${rootNamespace}`);
  if (assemblyName) lines.push(`- AssemblyName: ${assemblyName}`);
  if (nullable) lines.push(`- Nullable: ${nullable}`);
  if (langVersion) lines.push(`- LangVersion: ${langVersion}`);
  if (implicitUsings) lines.push(`- ImplicitUsings: ${implicitUsings}`);

  lines.push("");
  lines.push(
    `## NuGet 参照 (${packageMatches.length + packageNoVerMatches.length}件)`
  );
  if (packageMatches.length + packageNoVerMatches.length === 0) {
    lines.push("- （なし）");
  } else {
    for (const m of packageMatches) {
      lines.push(`- ${m[1]} @ ${m[2]}`);
    }
    for (const m of packageNoVerMatches) {
      lines.push(`- ${m[1]} (バージョン指定なし)`);
    }
  }

  lines.push("");
  lines.push(`## プロジェクト参照 (${projectMatches.length}件)`);
  if (projectMatches.length === 0) {
    lines.push("- （なし）");
  } else {
    for (const m of projectMatches) {
      lines.push(`- ${m[1]}`);
    }
  }

  return lines.join("\n");
}

type ToolHandler = (
  args: Record<string, unknown>,
  context: ResolveContext
) => Promise<string>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  read_file: readFile,
  write_file: writeFile,
  list_files: listFiles,
  run_command: runCommand,
  search_files: searchFiles,
  scan_csproj: scanCsproj,
};

export interface ExecuteToolOptions {
  mode?: ExecutionMode;
  attachedRoot?: string;
}

const PLANNING_BLOCKED_TOOLS = new Set(["write_file", "run_command"]);

export async function executeTool(
  toolCall: ToolCall,
  options: ExecuteToolOptions = {}
): Promise<ToolResult> {
  const { mode = "normal", attachedRoot } = options;

  // Plan Mode では書き込み系ツールを二重防御で拒否
  if (mode === "planning" && PLANNING_BLOCKED_TOOLS.has(toolCall.name)) {
    return {
      tool_call_id: toolCall.id,
      content: `Plan Mode では書き込み系ツール（${toolCall.name}）は使用できません。調査系ツール（read_file / list_files / search_files / scan_csproj）のみ利用可能です。`,
      is_error: true,
    };
  }

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
    const content = await handler(toolCall.arguments, { attachedRoot });
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
  // workspace の初期化は default 引数の時だけ行う
  if (dir === WORKSPACE_ROOT) {
    await ensureWorkspace();
  }
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nodes: FileTreeNode[] = [];
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
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
