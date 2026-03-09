import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { loadConfig } from "../src/helper/loadConfig";

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "hb-test-"));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

const writeTempConfig = (filename: string, content: string): string => {
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
};

const validConfig = JSON.stringify({
  id: "test-id",
  title: "Test",
  questions: [],
});

describe("loadConfig", () => {
  it("returns a parsed QuestionnaireConfig for a valid file", () => {
    const filePath = writeTempConfig("valid.json", validConfig);
    const config = loadConfig(filePath);

    expect(config.id).toBe("test-id");
    expect(config.title).toBe("Test");
    expect(config.questions).toEqual([]);
  });

  it("throws when file does not exist", () => {
    expect(() => loadConfig("/non/existent/path.json")).toThrow(
      "Config file not found",
    );
  });

  it("throws when file contains invalid JSON", () => {
    const filePath = writeTempConfig("bad.json", "{ not valid json }");
    expect(() => loadConfig(filePath)).toThrow("Config file is not valid JSON");
  });

  it("throws when id field is missing", () => {
    const filePath = writeTempConfig(
      "no-id.json",
      JSON.stringify({ title: "Test", questions: [] }),
    );
    expect(() => loadConfig(filePath)).toThrow("missing required fields");
  });

  it("throws when title field is missing", () => {
    const filePath = writeTempConfig(
      "no-title.json",
      JSON.stringify({ id: "x", questions: [] }),
    );
    expect(() => loadConfig(filePath)).toThrow("missing required fields");
  });

  it("throws when questions field is missing", () => {
    const filePath = writeTempConfig(
      "no-questions.json",
      JSON.stringify({ id: "x", title: "Test" }),
    );
    expect(() => loadConfig(filePath)).toThrow("missing required fields");
  });

  it("throws when questions is not an array", () => {
    const filePath = writeTempConfig(
      "bad-questions.json",
      JSON.stringify({ id: "x", title: "Test", questions: "not-an-array" }),
    );
    expect(() => loadConfig(filePath)).toThrow("missing required fields");
  });
});
