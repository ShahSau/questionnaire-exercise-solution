import { SessionResult } from "../types";

export function displaySummary(result: SessionResult | any): void {
  const rows = result.json();
  const divider = "─".repeat(60);

  console.log(`\n${divider}`);
  console.log(`  Session Summary`);
  console.log(`  Session ID : ${result.sessionId}`);
  console.log(`  Completed  : ${result.completedAt.toLocaleString()}`);
  console.log(divider);

  rows.forEach(({ question, answer }, index) => {
    console.log(`  ${index + 1}. ${question}`);
    console.log(`     → ${answer}`);
  });

  console.log(`${divider}\n`);
}
