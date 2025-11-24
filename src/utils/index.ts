import chalk from "chalk";
import ora from "ora";

export const logger = {
  info: (msg: string) => console.log(chalk.blue("ℹ") + " " + msg),
  success: (msg: string) => console.log(chalk.green("✔") + " " + msg),
  warn: (msg: string) => console.log(chalk.yellow("⚠") + " " + msg),
  error: (msg: string) => console.log(chalk.red("✖") + " " + msg),
};

export const spinner = ora();

export * from "./git.js";
