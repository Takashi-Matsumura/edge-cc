import { getWorkspaceTree } from "@/lib/agent/executor";

export async function GET() {
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
