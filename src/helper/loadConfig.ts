import { QuestionnaireConfig } from "../types";
import * as path from "path";
import * as fs from "fs";

export function loadConfig(filePath: string): QuestionnaireConfig {
  const resolved = path.resolve(filePath);

  // Check if file exists
  if (!fs.existsSync(resolved)) {
    throw new Error(`Config file not found: ${resolved}`);
  }

  // Check if it's a valid JSON file
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  } catch {
    throw new Error(`Config file is not valid JSON: ${resolved}`);
  }

  // Check if it has the required structure (id, title, questions[]) before the engine sees the config
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("id" in raw) ||
    !("title" in raw) ||
    !("questions" in raw) ||
    !Array.isArray((raw as Record<string, unknown>).questions)
  ) {
    throw new Error(
      `Config file is missing required fields (id, title, questions[]): ${resolved}`,
    );
  }

  return raw as QuestionnaireConfig;
}
