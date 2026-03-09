# Heartbeat Engineering Exercise

A CLI questionnaire engine built in TypeScript. It loads a question set from a JSON file, walks the user through each question in order, handles conditional branching, and prints a summary at the end. The process is cyclic: after each session, it asks if you want to run another one so you don't have to restart the app.

---

## Getting Started

You'll need Node.js version 22.

```bash
npm install
```
---

## Running the App

| Command | Description |
|---|---|
| `npm run preview` | Builds once and runs natively.|
| `npm run dev` | Builds and runs with a watcher.|
| `npm run typecheck` | Runs tsc without emitting.|
| `npm run lint` | Runs ESLint across the whole project.|
| `npm run test` | Runs the entire test suite once.|

---

## Design Decisions

### Why `@inquirer/prompts`
The reason is that Node's native `readline` module only gives raw line input. It has no concept of arrow key navigation, multiselect toggling, or re-prompting on invalid input. For `text` and `confirm` questions, `readline` would have been fine. But since we are also using `select` and `multiselect`, i opt to choose `@inquirer/prompts`.

### Input Validation
The engine decides which questions to ask. The prompter validates how they are answered. Validation rules are defined per question in `questionnaire.json` and enforced in `prompter.ts`.

**`text`** — checks `required` (empty/whitespace), `maxLength`, and optionally a `pattern` regex. Inquirer's `validate` callback handles re-prompting automatically when these fail.

**`number`** — checks `required`, `min`, and `max`. Inquirer's `number()` natively rejects non-numeric input before our validator even runs.

**`confirm`** — no validation needed. Inquirer only accepts yes/no, so invalid input is impossible by design.

**`select`** — no validation needed. The user can only pick from a predefined list, so Inquirer makes invalid input structurally impossible.

**`multiselect`** — checks `required` (at least one selection). Because `@inquirer/prompts` returns `readonly string[]` from `checkbox()`, the `validate` callback has a type clash, so the required check runs after the prompt resolves rather than inside it.

### process.exit(0) on goodbye
Without it, `@inquirer/prompts` keeps the readline interface open and the terminal freezes after the last prompt. For a CLI tool, this is an explicit exit.

### AnswerMap as Map<id, Answer> and equals and includes operator
An absent key in `AnswerMap` explicitly means the question condition was not met and was skipped.  `equals` handles scalar types. `includes` handles multiselect arrays. 