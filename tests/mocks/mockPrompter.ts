import { Prompter } from "../../src/prompter";
import { Question, AnswerValue } from "../../src/types";

export class MockPrompter implements Prompter {
  private answers: Map<string, AnswerValue>;

  constructor(answers: Record<string, AnswerValue>) {
    this.answers = new Map(Object.entries(answers));
  }

  async ask(question: Question): Promise<AnswerValue> {
    if (!this.answers.has(question.id)) {
      throw new Error(
        `MockPrompter has no answer defined for question: "${question.id}". Add it to the answers map.`,
      );
    }
    return this.answers.get(question.id)!;
  }
}
