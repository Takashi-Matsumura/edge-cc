export const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description:
        "指定されたパスのファイル内容を読み取ります。ワークスペース内のファイルのみ読み取り可能です。",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "読み取るファイルのパス（ワークスペースルートからの相対パス）",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description:
        "指定されたパスにファイルを作成または上書きします。親ディレクトリは自動作成されます。",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "書き込むファイルのパス（ワークスペースルートからの相対パス）",
          },
          content: {
            type: "string",
            description: "ファイルに書き込む内容",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_files",
      description:
        "指定されたディレクトリのファイルとフォルダを一覧表示します。",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "一覧表示するディレクトリのパス（デフォルト: ワークスペースルート）",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "run_command",
      description:
        "ワークスペースディレクトリでシェルコマンドを実行します。タイムアウトは10秒です。",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "実行するシェルコマンド",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_files",
      description:
        "ワークスペース内のファイルから指定パターンに一致する行を検索します。",
      parameters: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "検索する文字列パターン",
          },
          path: {
            type: "string",
            description:
              "検索対象のディレクトリパス（デフォルト: ワークスペースルート）",
          },
        },
        required: ["pattern"],
      },
    },
  },
];

export const toolDescriptionForPrompt = `
利用可能なツール:

1. read_file: ファイルを読み取る
   使い方: {"tool": "read_file", "arguments": {"path": "ファイルパス"}}

2. write_file: ファイルを作成・上書きする
   使い方: {"tool": "write_file", "arguments": {"path": "ファイルパス", "content": "内容"}}

3. list_files: ディレクトリの中身を一覧する
   使い方: {"tool": "list_files", "arguments": {"path": "ディレクトリパス"}}
   ※ pathを省略するとワークスペースルートを一覧します

4. run_command: シェルコマンドを実行する
   使い方: {"tool": "run_command", "arguments": {"command": "コマンド"}}

5. search_files: ファイル内を検索する
   使い方: {"tool": "search_files", "arguments": {"pattern": "検索文字列", "path": "ディレクトリパス"}}
`;
