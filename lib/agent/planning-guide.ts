import type { GuideEvent } from "./types";

export function guideForPlanningStart(): GuideEvent {
  return {
    type: "guide",
    phase: "plan_start",
    content:
      "Plan Mode を開始します。エージェントは書き込み系ツール（write_file / run_command）を使わず、read_file / list_files / search_files で状況を調査し、実行計画を立てます。計画はユーザーが承認するまで実行されません。これは「見切り発車」を防ぎ、エージェントの意図を事前に確認できる仕組みです。",
  };
}

export function guideForPlanGenerated(): GuideEvent {
  return {
    type: "guide",
    phase: "plan_generated",
    content:
      "実行計画が生成されました。下の計画カードで内容を確認し、「この計画で実行」を押すと通常モードで計画が実行されます。「却下」を押すと計画は破棄され、何も実行されません。",
  };
}
