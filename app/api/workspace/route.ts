import path from "path";
import { getWorkspaceTree } from "@/lib/agent/executor";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const root = url.searchParams.get("root");
  const attachedRoot = url.searchParams.get("attachedRoot");

  if (root === "attached") {
    if (!attachedRoot || !path.isAbsolute(attachedRoot)) {
      return Response.json(
        { error: "attachedRoot (絶対パス) が必要です" },
        { status: 400 }
      );
    }
    const tree = await getWorkspaceTree(path.resolve(attachedRoot));
    return Response.json(tree);
  }

  const tree = await getWorkspaceTree();
  return Response.json(tree);
}

export async function DELETE() {
  const { promises: fs } = await import("fs");
  const { WORKSPACE_ROOT } = await import("@/lib/agent/executor");
  try {
    await fs.rm(WORKSPACE_ROOT, { recursive: true, force: true });
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
