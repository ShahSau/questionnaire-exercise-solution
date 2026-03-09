import { describe, it, expect } from "vitest";
import {
  validateText,
  validateNumber,
  validateMultiSelect,
} from "../src/helper/validation";
import {
  TextQuestion,
  NumberQuestion,
  MultiSelectQuestion,
} from "../src/types";

const textQ = (validation?: TextQuestion["validation"]): TextQuestion => ({
  id: "q1",
  order: 10,
  type: "text",
  text: "Q?",
  validation,
});

const numberQ = (
  validation?: NumberQuestion["validation"],
): NumberQuestion => ({
  id: "q1",
  order: 10,
  type: "number",
  text: "Q?",
  validation,
});

const multiQ = (
  validation?: MultiSelectQuestion["validation"],
): MultiSelectQuestion => ({
  id: "q1",
  order: 10,
  type: "multiselect",
  text: "Q?",
  options: ["A", "B"],
  validation,
});

// Text validation tests
describe("validateText", () => {
  it("returns true for valid input", () => {
    expect(validateText("Alice", textQ({ required: true }))).toBe(true);
  });

  it("returns error when required and empty", () => {
    expect(validateText("", textQ({ required: true }))).toBeTypeOf("string");
  });

  it("returns error when required and only whitespace", () => {
    expect(validateText("   ", textQ({ required: true }))).toBeTypeOf("string");
  });

  it("returns true when not required and empty", () => {
    expect(validateText("", textQ({ required: false }))).toBe(true);
  });

  it("returns error when maxLength exceeded", () => {
    expect(validateText("abc", textQ({ maxLength: 2 }))).toBeTypeOf("string");
  });

  it("returns true when at maxLength boundary", () => {
    expect(validateText("ab", textQ({ maxLength: 2 }))).toBe(true);
  });
});

// Number validation tests
describe("validateNumber", () => {
  it("returns true for valid number within range", () => {
    expect(validateNumber(30, numberQ({ min: 0, max: 120 }))).toBe(true);
  });

  it("returns error when below min", () => {
    expect(validateNumber(-1, numberQ({ min: 0 }))).toBeTypeOf("string");
  });

  it("returns error when above max", () => {
    expect(validateNumber(121, numberQ({ max: 120 }))).toBeTypeOf("string");
  });

  it("returns true when at min boundary", () => {
    expect(validateNumber(0, numberQ({ min: 0 }))).toBe(true);
  });

  it("returns true when at max boundary", () => {
    expect(validateNumber(120, numberQ({ max: 120 }))).toBe(true);
  });

  it("returns error when required and undefined", () => {
    expect(validateNumber(undefined, numberQ({ required: true }))).toBeTypeOf(
      "string",
    );
  });

  it("returns true when not required and undefined", () => {
    expect(validateNumber(undefined, numberQ({ required: false }))).toBe(true);
  });
});

// Multi-select validation tests
describe("validateMultiSelect", () => {
  it("returns true when at least one option selected", () => {
    expect(validateMultiSelect(["A"], multiQ({ required: true }))).toBe(true);
  });

  it("returns error when required and nothing selected", () => {
    expect(validateMultiSelect([], multiQ({ required: true }))).toBeTypeOf(
      "string",
    );
  });

  it("returns true when not required and empty", () => {
    expect(validateMultiSelect([], multiQ({ required: false }))).toBe(true);
  });
});
