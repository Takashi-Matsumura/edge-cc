import { WORKSPACE_ROOT } from "@/lib/agent/executor";
import { execAsync } from "@/lib/utils/exec";

export async function POST() {
  const result = await execAsync(`open "${WORKSPACE_ROOT}"`);

  if (result.isError) {
    return Response.json({ error: result.output }, { status: 500 });
  }
  return Response.json({ success: true });
}
