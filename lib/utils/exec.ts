import { exec } from "child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number | null;
  isError: boolean;
}

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
  maxBuffer?: number;
  env?: NodeJS.ProcessEnv;
}

const DEFAULT_OPTIONS: ExecOptions = {
  timeout: 10000,
  maxBuffer: 1024 * 1024,
};

export function execAsync(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  const merged = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve) => {
    exec(command, merged, (error, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join("\n");
      resolve({
        stdout: stdout || "",
        stderr: stderr || "",
        output: output || "(出力なし)",
        exitCode: error?.code ?? 0,
        isError: !!error && !stdout && !stderr,
      });
    });
  });
}
