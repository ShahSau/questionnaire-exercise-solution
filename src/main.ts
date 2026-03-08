import { createLogger } from "./logger";
import { QuestionnaireEngineFactory } from "./engine";
import { confirm } from "@inquirer/prompts";
import { loadConfig } from "./helper/loadConfig";
import { displaySummary } from "./helper/displaySummery";
const logger = createLogger("main");

async function start() {
  logger.info("Application started!");

  const config = loadConfig("data/questionnaire.json");
  logger.info(
    `Loaded config: "${config.title}" (${config.questions.length} questions)`,
  );

  const engine = QuestionnaireEngineFactory.mockEngine(
    createLogger("MockEngine"),
  );

  while (true) {
    const sessionId = crypto.randomUUID();

    try {
      console.log(`\nStarting questionnaire: "${config.title}"\n`);
      const result = await engine.runSession(sessionId);
      displaySummary(result);
    } catch (error) {
      logger.error(`Session ${sessionId} failed: ${(error as Error).message}`);
      console.error(
        "\nSomething went wrong during the session. Please try again.\n",
      );
    }

    const again = await confirm({
      message: "Would you like to start a new session?",
    }).catch(() => false); // Handles Ctrl+C gracefully during this prompt

    if (!again) {
      console.log("\nThank you. Goodbye.\n");
      process.exit(0);
    }
  }
}

start().catch((error) => {
  logger.error(`Fatal error: ${(error as Error).message}`);
  process.exit(1);
});
