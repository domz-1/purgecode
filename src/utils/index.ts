// import chalk from "chalk";
import ora from "ora";

export const logger = {
  info: (msg: string) => console.log("ℹ " + msg),
  success: (msg: string) => console.log("✔ " + msg),
  warn: (msg: string) => console.log("⚠ " + msg),
  error: (msg: string) => console.log("✖ " + msg),
};

export const spinner = ora();

export * from "./git.js";
