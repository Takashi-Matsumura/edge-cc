/**
 * llama.cpp の /props をプロキシして、フロントに必要な情報だけを返す API。
 * - モデル名（ファイル名から拡張子を落としたもの）
 * - コンテキストウィンドウサイズ (n_ctx)
 * - 並列スロット数
 * - llama.cpp ビルド情報
 *
 * ブラウザから直接 llama.cpp を叩かせない目的もある（CORS 回避 + 情報の正規化）。
 */

const LLAMA_CPP_URL =
  process.env.LLAMA_CPP_URL || "http://localhost:8080";

interface PropsResponse {
  default_generation_settings?: {
    n_ctx?: number;
  };
  total_slots?: number;
  model_path?: string;
  build_info?: string;
}

export async function GET() {
  try {
    const res = await fetch(`${LLAMA_CPP_URL}/props`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return Response.json(
        {
          error: `llama.cpp /props returned ${res.status}`,
          available: false,
        },
        { status: 502 }
      );
    }
    const data: PropsResponse = await res.json();
    const modelPath = data.model_path || "";
    const modelName = modelPath
      ? modelPath.split("/").pop()?.replace(/\.gguf$/i, "") || modelPath
      : "unknown";

    return Response.json({
      available: true,
      model: modelName,
      n_ctx: data.default_generation_settings?.n_ctx ?? null,
      total_slots: data.total_slots ?? null,
      build_info: data.build_info ?? null,
    });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : String(err),
        available: false,
      },
      { status: 503 }
    );
  }
}
