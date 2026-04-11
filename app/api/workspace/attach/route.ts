import { promises as fs } from "fs";
import os from "os";
import path from "path";

/**
 * Attached Directory のパスを検証する API。
 * - `~` の展開、絶対パスであること、存在してディレクトリであることを確認する
 * - サーバ側に状態は保持しない（クライアントの localStorage で管理する前提）
 * - 検証に成功したら正規化したパスを返し、クライアントはそれを保存する
 */
export async function POST(request: Request) {
  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = body.path;
  if (!input || typeof input !== "string") {
    return Response.json({ error: "path is required" }, { status: 400 });
  }

  // `~` を展開
  let expanded = input.trim();
  if (expanded === "~") {
    expanded = os.homedir();
  } else if (expanded.startsWith("~/")) {
    expanded = path.join(os.homedir(), expanded.slice(2));
  }

  if (!path.isAbsolute(expanded)) {
    return Response.json(
      { error: "絶対パスを指定してください（例: /Users/you/projects/my-app）" },
      { status: 400 }
    );
  }

  // 正規化
  const normalized = path.resolve(expanded);

  // 存在確認
  try {
    const stat = await fs.stat(normalized);
    if (!stat.isDirectory()) {
      return Response.json(
        { error: "指定されたパスはディレクトリではありません" },
        { status: 400 }
      );
    }
  } catch {
    return Response.json(
      { error: "指定されたパスが存在しません" },
      { status: 404 }
    );
  }

  return Response.json({ success: true, path: normalized });
}
