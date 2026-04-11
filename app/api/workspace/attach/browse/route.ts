import { exec } from "child_process";
import os from "os";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * macOS の Finder でフォルダ選択ダイアログを開き、選択された絶対パスを返す API。
 * - osascript 経由で AppleScript の `choose folder` を呼び出す
 * - localhost 上で動く Next.js dev server 前提（Docker や Linux では 400 を返す）
 * - ユーザがキャンセルした場合は { canceled: true } を返す
 */
export async function POST() {
  if (os.platform() !== "darwin") {
    return Response.json(
      {
        error:
          "この機能は macOS 専用です。手入力でパスを指定してください。",
      },
      { status: 400 }
    );
  }

  const script =
    'POSIX path of (choose folder with prompt "edge-cc にアタッチするディレクトリを選択してください")';

  try {
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const selectedPath = stdout.trim();
    if (!selectedPath) {
      return Response.json({ canceled: true });
    }
    // 末尾のスラッシュを除去して返す
    const normalized = selectedPath.replace(/\/$/, "");
    return Response.json({ path: normalized });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // ユーザがキャンセルしたとき osascript は -128 を返す
    if (message.includes("-128") || message.includes("User canceled")) {
      return Response.json({ canceled: true });
    }
    return Response.json(
      { error: `フォルダ選択ダイアログの起動に失敗しました: ${message}` },
      { status: 500 }
    );
  }
}
