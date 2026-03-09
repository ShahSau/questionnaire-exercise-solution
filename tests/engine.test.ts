import { describe, it, expect, vi } from "vitest";
import { QuestionnaireEngine } from "../src/engine";
import { createLogger } from "../src/logger";
import { QuestionnaireConfig } from "../src/types";
import { MockPrompter } from "./mocks/mockPrompter";

const baseConfig: QuestionnaireConfig = {
  id: "test-config",
  title: "Test Questionnaire",
  questions: [
    {
      id: "q_name",
      order: 10,
      type: "text",
      text: "What is your name?",
      validation: { required: true },
    },
    {
      id: "q_has_symptoms",
      order: 20,
      type: "confirm",
      text: "Do you have symptoms?",
      validation: { required: true },
    },
    {
      id: "q_symptom_list",
      order: 30,
      type: "multiselect",
      text: "Which symptoms?",
      options: ["Headache", "Fever", "Other"],
      condition: {
        questionId: "q_has_symptoms",
        operator: "equals",
        answer: true,
      },
      validation: { required: true },
    },
    {
      id: "q_headache_location",
      order: 35,
      type: "text",
      text: "Where is the headache?",
      condition: {
        questionId: "q_symptom_list",
        operator: "includes",
        answer: "Headache",
      },
      validation: { required: true },
    },
    {
      id: "q_other_symptom",
      order: 40,
      type: "text",
      text: "Describe your other symptom.",
      condition: {
        questionId: "q_symptom_list",
        operator: "includes",
        answer: "Other",
      },
      validation: { required: true },
    },
    {
      id: "q_age",
      order: 50,
      type: "number",
      text: "How old are you?",
      validation: { required: true, min: 0, max: 120 },
    },
  ],
};

const logger = createLogger("test");

const makeEngine = (
  config: QuestionnaireConfig,
  answers: Record<string, unknown>,
) => {
  return new QuestionnaireEngine(
    config,
    new MockPrompter(
      answers as Record<string, import("../src/types").AnswerValue>,
    ),
    logger,
  );
};

describe("QuestionnaireEngine", () => {
  describe("Linear session", () => {
    it("records all answers when no conditions are present", async () => {
      const config: QuestionnaireConfig = {
        id: "linear-test",
        title: "Linear",
        questions: [
          { id: "q1", order: 10, type: "text", text: "Q1?" },
          { id: "q2", order: 20, type: "number", text: "Q2?" },
          { id: "q3", order: 30, type: "confirm", text: "Q3?" },
        ],
      };

      const engine = makeEngine(config, { q1: "Alice", q2: 30, q3: true });
      const result = await engine.runSession("session-1");

      expect(result.answers).toHaveLength(3);
      expect(result.sessionId).toBe("session-1");
      expect(result.configId).toBe("linear-test");
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it("sorts questions by order regardless of array position", async () => {
      const config: QuestionnaireConfig = {
        id: "order-test",
        title: "Order Test",
        questions: [
          { id: "q2", order: 20, type: "text", text: "Second?" },
          { id: "q1", order: 10, type: "text", text: "First?" },
          { id: "q3", order: 30, type: "text", text: "Third?" },
        ],
      };

      const engine = makeEngine(config, { q1: "a", q2: "b", q3: "c" });
      const result = await engine.runSession("session-order");

      expect(result.answers.map((a) => a.questionId)).toEqual([
        "q1",
        "q2",
        "q3",
      ]);
    });
  });

  describe("Condition: equals", () => {
    it("shows a conditional question when condition is met", async () => {
      const engine = makeEngine(baseConfig, {
        q_name: "Alice",
        q_has_symptoms: true,
        q_symptom_list: ["Fever"],
        q_age: 30,
      });

      const result = await engine.runSession("session-2");
      const ids = result.answers.map((a) => a.questionId);

      expect(ids).toContain("q_symptom_list");
    });

    it("skips a conditional question when condition is not met", async () => {
      const engine = makeEngine(baseConfig, {
        q_name: "Alice",
        q_has_symptoms: false,
        q_age: 30,
      });

      const result = await engine.runSession("session-3");
      const ids = result.answers.map((a) => a.questionId);

      expect(ids).not.toContain("q_symptom_list");
      expect(ids).not.toContain("q_headache_location");
      expect(ids).not.toContain("q_other_symptom");
    });
  });

  describe("Condition: includes", () => {
    it("shows a question when multiselect answer includes the target value", async () => {
      const engine = makeEngine(baseConfig, {
        q_name: "Alice",
        q_has_symptoms: true,
        q_symptom_list: ["Headache", "Fever"],
        q_headache_location: "temples",
        q_age: 30,
      });

      const result = await engine.runSession("session-4");
      const ids = result.answers.map((a) => a.questionId);

      expect(ids).toContain("q_headache_location");
    });

    it("skips a question when multiselect answer does not include the target value", async () => {
      const engine = makeEngine(baseConfig, {
        q_name: "Alice",
        q_has_symptoms: true,
        q_symptom_list: ["Fever"],
        q_age: 30,
      });

      const result = await engine.runSession("session-5");
      const ids = result.answers.map((a) => a.questionId);

      expect(ids).not.toContain("q_headache_location");
    });
  });

  // q_headache_location depends on q_symptom_list includes "Headache"
  // q_symptom_list depends on q_has_symptoms equals true
  // if q_has_symptoms is false → both should be skipped
  describe("Chained conditions", () => {
    it("skips a chained question when its parent was skipped", async () => {
      const engine = makeEngine(baseConfig, {
        q_name: "Alice",
        q_has_symptoms: false,
        q_age: 30,
      });

      const result = await engine.runSession("session-6");
      const ids = result.answers.map((a) => a.questionId);

      expect(ids).not.toContain("q_symptom_list");
      expect(ids).not.toContain("q_headache_location");
    });
  });

  describe("Edge cases", () => {
    it("returns empty result for config with no questions", async () => {
      const config: QuestionnaireConfig = {
        id: "empty",
        title: "Empty",
        questions: [],
      };

      const engine = makeEngine(config, {});
      const result = await engine.runSession("session-empty");

      expect(result.answers).toHaveLength(0);
      expect(result.json()).toEqual([]);
    });

    it("logs a warning and skips when condition references unknown questionId", async () => {
      const config: QuestionnaireConfig = {
        id: "bad-condition",
        title: "Bad Condition",
        questions: [
          {
            id: "q1",
            order: 10,
            type: "text",
            text: "Q1?",
            condition: {
              questionId: "non_existent",
              operator: "equals",
              answer: true,
            },
          },
        ],
      };

      const warnLogger = createLogger("test-warn");
      const warnSpy = vi.spyOn(warnLogger, "warn");
      const engine = new QuestionnaireEngine(
        config,
        new MockPrompter({}),
        warnLogger,
      );
      const result = await engine.runSession("session-warn");

      expect(result.answers).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("non_existent"),
      );
    });

    it("propagates error when prompter.ask() throws", async () => {
      const config: QuestionnaireConfig = {
        id: "error-test",
        title: "Error Test",
        questions: [{ id: "q1", order: 10, type: "text", text: "Q1?" }],
      };

      const engine = new QuestionnaireEngine(
        config,
        new MockPrompter({}),
        logger,
      );

      await expect(engine.runSession("session-error")).rejects.toThrow(
        'MockPrompter has no answer defined for question: "q1"',
      );
    });
  });

  describe("SessionResult.json()", () => {
    it("normalizes all answer types to strings", async () => {
      const config: QuestionnaireConfig = {
        id: "json-test",
        title: "JSON Test",
        questions: [
          { id: "q_text", order: 10, type: "text", text: "Name?" },
          { id: "q_num", order: 20, type: "number", text: "Age?" },
          { id: "q_confirm", order: 30, type: "confirm", text: "Consent?" },
          {
            id: "q_multi",
            order: 40,
            type: "multiselect",
            text: "Symptoms?",
            options: ["Fever", "Cough"],
          },
        ],
      };

      const engine = makeEngine(config, {
        q_text: "Alice",
        q_num: 30,
        q_confirm: true,
        q_multi: ["Fever", "Cough"],
      });

      const result = await engine.runSession("session-json");
      const json = result.json();

      expect(json[0].answer).toBe("Alice");
      expect(json[1].answer).toBe("30");
      expect(json[2].answer).toBe("true");
      expect(json[3].answer).toBe("Fever, Cough");
    });
  });
});
