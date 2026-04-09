import { exec } from "child_process";
import { WORKSPACE_ROOT } from "@/lib/agent/executor";

export async function POST() {
  return new Promise<Response>((resolve) => {
    exec(`open "${WORKSPACE_ROOT}"`, (error) => {
      if (error) {
        resolve(
          Response.json(
            { error: error.message },
            { status: 500 }
          )
        );
      } else {
        resolve(Response.json({ success: true }));
      }
    });
  });
}
