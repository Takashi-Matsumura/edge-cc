/**
 * unknown 型の値を安全に string に変換する。
 * undefined/null/非文字列の場合はエラーを投げる。
 */
export function requireString(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${fieldName} は必須の文字列パラメータです`);
  }
  return value;
}

/**
 * 省略可能な string パラメータ。未指定時はデフォルト値を返す。
 */
export function optionalString(
  value: unknown,
  defaultValue: string
): string {
  if (value == null || value === "") return defaultValue;
  if (typeof value !== "string") {
    throw new Error("文字列を指定してください");
  }
  return value;
}
