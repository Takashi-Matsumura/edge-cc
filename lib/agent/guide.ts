import type { ToolCall, ToolResult, GuideEvent } from "./types";

const TOOL_EXPLANATIONS: Record<string, { why: string; what: string }> = {
  read_file: {
    why: "エージェントは既存のファイルの内容を確認する必要があると判断しました。人間がエディタでファイルを開くのと同じ行動です。",
    what: "指定されたパスのファイルを読み取り、その内容をエージェントの「記憶」（会話履歴）に追加します。",
  },
  write_file: {
    why: "エージェントはファイルを作成または変更する必要があると判断しました。コードを書く、設定ファイルを作るなど、実際の「作業」にあたります。",
    what: "指定されたパスにファイルを書き込みます。親ディレクトリがなければ自動で作成されます。",
  },
  list_files: {
    why: "エージェントはワークスペースの状態（どんなファイルがあるか）を把握しようとしています。作業前の「現状確認」です。",
    what: "ディレクトリの中身を一覧表示し、ファイル構成をエージェントに伝えます。",
  },
  run_command: {
    why: "エージェントはシェルコマンドを実行する必要があると判断しました。プログラムの実行、パッケージのインストールなどが該当します。",
    what: "ワークスペース内でコマンドを実行し、その出力（標準出力・標準エラー）をエージェントに返します。",
  },
  search_files: {
    why: "エージェントはファイル群の中から特定のテキストを探す必要があると判断しました。grep のような検索操作です。",
    what: "ワークスペース内のファイルを横断的に検索し、パターンに一致する行を返します。",
  },
};

function describeToolArgs(tc: ToolCall): string {
  switch (tc.name) {
    case "read_file":
      return `「${tc.arguments.path}」を読み取ります。`;
    case "write_file":
      return `「${tc.arguments.path}」にファイルを書き込みます。`;
    case "list_files":
      return `「${tc.arguments.path || ".（ルート）"}」の中身を確認します。`;
    case "run_command":
      return `コマンド「${tc.arguments.command}」を実行します。`;
    case "search_files":
      return `「${tc.arguments.pattern}」を${tc.arguments.path || "ワークスペース全体"}から検索します。`;
    default:
      return "";
  }
}

export function guideForLoopStart(iteration: number): GuideEvent {
  if (iteration === 0) {
    return {
      type: "guide",
      phase: "loop_start",
      iteration: iteration + 1,
      content:
        "エージェントループを開始します。ユーザーの指示と会話履歴を LLM に送り、「次に何をすべきか」を判断させます。LLM がツールの使用を指示すれば実行し、その結果をもとに再び LLM に判断を仰ぎます。これがエージェントの核心的な仕組みです。",
    };
  }
  return {
    type: "guide",
    phase: "loop_continue",
    iteration: iteration + 1,
    content: `ループ ${iteration + 1} 回目: 前回のツール実行結果が会話履歴に追加されました。LLM はこの結果を踏まえて「タスクは完了したか？ まだ追加の作業が必要か？」を再判断します。`,
  };
}

export function guideForToolChoice(tc: ToolCall, iteration: number): GuideEvent {
  const info = TOOL_EXPLANATIONS[tc.name] || {
    why: "エージェントがこのツールを選択しました。",
    what: "",
  };
  const argsDesc = describeToolArgs(tc);

  return {
    type: "guide",
    phase: "tool_choice",
    iteration: iteration + 1,
    content: `🔧 ツール選択: ${tc.name}\n\n【なぜこのツール？】${info.why}\n\n【何をする？】${info.what} ${argsDesc}`,
  };
}

export function guideForToolResult(tc: ToolCall, result: ToolResult, iteration: number): GuideEvent {
  const success = !result.is_error;
  let content: string;

  if (success) {
    content = `ツール「${tc.name}」は正常に完了しました。この結果は会話履歴に追加され、LLM が次の判断材料として使います。`;
    if (tc.name === "run_command" && result.content.includes("error")) {
      content += "\n\n出力にエラーらしき内容が含まれています。エージェントがこれを検知し、別のアプローチを試みる可能性があります。これは人間のエンジニアがエラーを見て対処するのと同じ行動です。";
    }
  } else {
    content = `ツール「${tc.name}」はエラーになりました。エージェントはこのエラー内容を読み取り、原因を分析して別の方法を試みます。エラーからの回復もエージェントの重要な能力です。`;
  }

  return {
    type: "guide",
    phase: "tool_result",
    iteration: iteration + 1,
    content,
  };
}

export function guideForLoopEnd(reason: "completed" | "max_iterations"): GuideEvent {
  if (reason === "completed") {
    return {
      type: "guide",
      phase: "loop_end",
      content:
        "LLM はツール呼び出しなしのテキストを返しました。これは「タスクが完了した」ことを意味します。エージェントループはここで終了し、最終的な応答をユーザーに表示します。",
    };
  }
  return {
    type: "guide",
    phase: "loop_end",
    content:
      "エージェントループが最大回数（15回）に達したため中断されました。無限ループを防ぐための安全機構です。",
  };
}
