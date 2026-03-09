import { Logger } from "./logger";
import {
  QuestionnaireConfig,
  SessionResult,
  AnswerMap,
  Condition,
  Question,
} from "./types";
import { Prompter } from "./prompter";

export class QuestionnaireEngine {
  private readonly config: QuestionnaireConfig;
  private readonly prompter: Prompter;
  private readonly logger: Logger;
  private readonly questions: Question[];

  constructor(config: QuestionnaireConfig, prompter: Prompter, logger: Logger) {
    this.config = config;
    this.prompter = prompter;
    this.logger = logger;
    this.questions = [...config.questions].sort((a, b) => a.order - b.order);
  }

  private evaluateCondition(condition: Condition, answers: AnswerMap): boolean {
    const targetAnswer = answers.get(condition.questionId);

    if (targetAnswer === undefined) {
      // Two cases: question was skipped (expected) or questionId is a config typo (warn)
      const questionExists = this.questions.some(
        (q) => q.id === condition.questionId,
      );
      if (!questionExists) {
        this.logger.warn(
          `Condition references unknown questionId: "${condition.questionId}". Check your config.`,
        );
      }
      return false;
    }

    if (condition.operator === "equals") {
      return targetAnswer.value === condition.answer;
    }

    if (condition.operator === "includes") {
      if (Array.isArray(targetAnswer.value)) {
        return targetAnswer.value.includes(condition.answer);
      }
      this.logger.warn(
        `Condition "includes" used on non-multiselect question: "${condition.questionId}"`,
      );
      return false;
    }

    return false;
  }

  public async runSession(sessionId: string): Promise<SessionResult> {
    const sessionLogger = this.logger.child(sessionId);
    sessionLogger.info(`Starting session for config: "${this.config.id}"`);

    if (this.questions.length === 0) {
      sessionLogger.warn(
        "No questions found in config. Returning empty session result.",
      );
    }

    const answers: AnswerMap = new Map();

    for (const question of this.questions) {
      if (
        question.condition &&
        !this.evaluateCondition(question.condition, answers)
      ) {
        sessionLogger.info(
          `Skipping question "${question.id}" — condition not met`,
        );
        continue;
      }

      try {
        const value = await this.prompter.ask(question);
        answers.set(question.id, {
          questionId: question.id,
          questionText: question.text,
          value,
        });
        sessionLogger.info(`Answered question "${question.id}"`);
      } catch (error) {
        sessionLogger.error(
          `Failed to get answer for question "${question.id}": ${(error as Error).message}`,
        );
        throw error;
      }
    }

    sessionLogger.info(`Session complete. ${answers.size} answers recorded.`);
    return this.buildResult(sessionId, answers);
  }

  private buildResult(sessionId: string, answers: AnswerMap): SessionResult {
    const answerArray = Array.from(answers.values());

    return {
      sessionId,
      configId: this.config.id,
      completedAt: new Date(),
      answers: answerArray,
      json: () =>
        answerArray.map((a) => ({
          question: a.questionText,
          answer: Array.isArray(a.value) ? a.value.join(", ") : String(a.value),
        })),
    };
  }
}

export const QuestionnaireEngineFactory = {
  create: (
    config: QuestionnaireConfig,
    prompter: Prompter,
    logger: Logger,
  ): QuestionnaireEngine => {
    return new QuestionnaireEngine(config, prompter, logger);
  },
};
