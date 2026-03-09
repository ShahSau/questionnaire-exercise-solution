import {
  TextQuestion,
  NumberQuestion,
  MultiSelectQuestion,
} from "../types";

export const validateText = (
  value: string,
  question: TextQuestion,
): true | string => {
  if (question.validation?.required && value.trim() === "") {
    return "This field is required.";
  }
  if (
    question.validation?.maxLength !== undefined &&
    value.trim().length > question.validation.maxLength
  ) {
    return `Answer must be ${question.validation.maxLength} characters or fewer.`;
  }
  return true;
};

export const validateNumber = (
  value: number | undefined,
  question: NumberQuestion,
): true | string => {
  if (question.validation?.required && value === undefined) {
    return "A number is required.";
  }
  if (
    value !== undefined &&
    question.validation?.min !== undefined &&
    value < question.validation.min
  ) {
    return `Value must be at least ${question.validation.min}.`;
  }
  if (
    value !== undefined &&
    question.validation?.max !== undefined &&
    value > question.validation.max
  ) {
    return `Value must be at most ${question.validation.max}.`;
  }
  return true;
};

export const validateMultiSelect = (
  value: string[],
  question: MultiSelectQuestion,
): true | string => {
  if (question.validation?.required && value.length === 0) {
    return "Please select at least one option.";
  }
  return true;
};
