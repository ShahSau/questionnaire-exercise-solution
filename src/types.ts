export type ConditionOperator = "equals" | "includes";

export type Condition =
  | {
      questionId: string;
      operator: "equals";
      answer: string | boolean | number;
    }
  | { questionId: string; operator: "includes"; answer: string };

export type BaseValidation = {
  required?: boolean;
};

export type TextValidation = BaseValidation & {
  maxLength?: number;
};

export type NumberValidation = BaseValidation & {
  min?: number;
  max?: number;
};

type BaseQuestion = {
  id: string;
  order: number;
  text: string;
  condition?: Condition;
};

export type TextQuestion = BaseQuestion & {
  type: "text";
  validation?: TextValidation;
};

export type NumberQuestion = BaseQuestion & {
  type: "number";
  validation?: NumberValidation;
};

export type ConfirmQuestion = BaseQuestion & {
  type: "confirm";
  validation?: BaseValidation;
};

export type SelectQuestion = BaseQuestion & {
  type: "select";
  options: string[];
  validation?: BaseValidation;
};

export type MultiSelectQuestion = BaseQuestion & {
  type: "multiselect";
  options: string[];
  validation?: BaseValidation;
};

export type Question =
  | TextQuestion
  | NumberQuestion
  | ConfirmQuestion
  | SelectQuestion
  | MultiSelectQuestion;

export type AnswerValue = string | number | boolean | string[];

export type Answer = {
  questionId: string;
  questionText: string;
  value: AnswerValue;
};

export type AnswerMap = Map<string, Answer>;

export type QuestionnaireConfig = {
  id: string;
  title: string;
  questions: Question[];
};

export type SessionResult = {
  sessionId: string;
  configId: string;
  completedAt: Date;
  answers: Answer[];
  json(): { question: string; answer: string }[];
};
