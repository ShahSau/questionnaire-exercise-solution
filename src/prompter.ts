import { input, number, confirm, select, checkbox } from "@inquirer/prompts";
import { Question, AnswerValue } from "./types";
import {
  validateText,
  validateNumber,
  validateMultiSelect,
} from "./helper/validation";

export interface Prompter {
  ask(question: Question): Promise<AnswerValue>;
}

export class CliPrompter implements Prompter {
  async ask(question: Question): Promise<AnswerValue> {
    switch (question.type) {
      case "text":
        return input({
          message: question.text,
          validate: (value) => validateText(value, question),
        });

      case "number":
        return number({
          message: question.text,
          validate: (value) => validateNumber(value, question),
        }) as Promise<number>;

      case "confirm":
        return confirm({
          message: question.text,
        });

      case "select":
        return select({
          message: question.text,
          choices: question.options.map((opt) => ({ value: opt })),
        });

      //   case "multiselect": {
      //     const result = await checkbox({
      //       message: question.text,
      //       choices: question.options.map((opt) => ({ value: opt })),
      //     });
      //     if (question.validation?.required && result.length === 0) {
      //       throw new Error("Please select at least one option.");
      //     }
      //     return result as string[];
      //   }
      case "multiselect": {
        const result = await checkbox({
          message: question.text,
          choices: question.options.map((opt) => ({ value: opt })),
        });
        const validation = validateMultiSelect([...result], question);
        if (validation !== true) {
          // checkbox has no re-prompt mechanism outside validate,
          // so we surface it as an error to main.ts
          throw new Error(validation);
        }
        return [...result] as string[];
      }
    }
  }
}
