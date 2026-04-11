import path from "path";
import { WORKSPACE_ROOT, resolveSafePath } from "@/lib/agent/executor";
import { execAsync } from "@/lib/utils/exec";

const RUNNERS: Record<string, (filePath: string) => string> = {
  ".py": (f) => `python3 "${f}"`,
  ".js": (f) => `node "${f}"`,
  ".ts": (f) => `npx tsx "${f}"`,
  ".sh": (f) => `bash "${f}"`,
  ".rb": (f) => `ruby "${f}"`,
  ".pl": (f) => `perl "${f}"`,
  ".php": (f) => `php "${f}"`,
};

export async function POST(request: Request) {
  let body: { path: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const filePath = body.path;
  if (!filePath || typeof filePath !== "string") {
    return Response.json({ error: "path is required" }, { status: 400 });
  }

  let resolved: string;
  try {
    resolved = resolveSafePath(filePath);
  } catch {
    return Response.json({ error: "Invalid path" }, { status: 403 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const runner = RUNNERS[ext];
  if (!runner) {
    return Response.json(
      { error: `実行方法が不明な拡張子です: ${ext}` },
      { status: 400 }
    );
  }

  const command = runner(resolved);
  const result = await execAsync(command, {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env, HOME: WORKSPACE_ROOT },
  });

  return Response.json({
    command,
    output: result.output,
    exitCode: result.exitCode,
    isError: result.isError,
  });
}
