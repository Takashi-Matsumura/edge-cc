import { promises as fs } from "fs";
import { resolveSafePath } from "@/lib/agent/executor";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get("path");
  if (!filePath) {
    return Response.json({ error: "path is required" }, { status: 400 });
  }

  let resolved: string;
  try {
    resolved = resolveSafePath(filePath);
  } catch {
    return Response.json({ error: "Invalid path" }, { status: 403 });
  }

  try {
    const content = await fs.readFile(resolved, "utf-8");
    return Response.json({ path: filePath, content });
  } catch {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
}
