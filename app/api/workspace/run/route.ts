import { exec } from "child_process";
import path from "path";
import { WORKSPACE_ROOT } from "@/lib/agent/executor";

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
  if (!filePath) {
    return Response.json({ error: "path is required" }, { status: 400 });
  }

  const resolved = path.resolve(WORKSPACE_ROOT, filePath);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
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

  return new Promise<Response>((resolve) => {
    exec(
      command,
      {
        cwd: WORKSPACE_ROOT,
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, HOME: WORKSPACE_ROOT },
      },
      (error, stdout, stderr) => {
        const output = [stdout, stderr].filter(Boolean).join("\n");
        resolve(
          Response.json({
            command,
            output: output || "(出力なし)",
            exitCode: error?.code ?? 0,
            isError: !!error && !stdout && !stderr,
          })
        );
      }
    );
  });
}
