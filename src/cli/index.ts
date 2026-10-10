import chalk from "chalk";
import { exec } from "child_process";
import { Command } from "commander";
import fs from "fs/promises";
import inquirer from "inquirer";
import path from "path";
import { Project } from "ts-morph";
import util from "util";
import { createBackup, restoreBackup } from "../utils/backup.js";
import {
  generateConfigFile,
  loadConfig,
  mergeConfig,
} from "../utils/config.js";
import {
  checkUnusedDependencies,
  removeUnusedDependencies,
} from "../core/dependencies.js";
import { findUnusedFiles } from "../core/graph.js";
import {
  formatFile,
  removeComments,
  removeConsole,
  removeEmptyFilesAndFolders,
  removeUnusedDeclarations,
  removeUnusedImports,
  removeUnusedVariables,
} from "../core/pruner.js";
import { scanFiles } from "../core/analyzer.js";
import { logger, spinner } from "../utils/index.js";
import { initCommand } from "./commands/init.js";

const program = new Command();
const execAsync = util.promisify(exec);

export default async function main() {
  program
    .name("purgecode")
    .description("A CLI tool to clean and prune your codebase")
    .version("1.0.0");

  // Init command
  program
    .command("init")
    .description("Initialize purgecode configuration")
    .action(async () => {
      await initCommand();
    });

  program
    .command("validate")
    .description("Validate purgecode configuration")
    .action(async () => {
      const { validateCommand } = await import("./commands/validate.js");
      await validateCommand();
    });

  program
    .command("list")
    .description("List unused files without deleting them")
    .option("--json", "Output results in JSON format")
    .action(async (options) => {
      const { listCommand } = await import("./commands/list.js");
      await listCommand(options);
    });

  program
    .command("watch")
    .description("Watch for file changes and re-run analysis")
    .action(async () => {
      const { watchCommand } = await import("./commands/watch.js");
      await watchCommand();
    });

  // Default prune command (backward compatibility)
  program
    .option("-i, --interactive", "Run in interactive mode")
    .option("--preview", "Run in preview mode (no changes)")
    .option("--unused-imports", "Remove unused imports")
    .option("--unused-variables", "Remove unused variables")
    .option(
      "--unused-declarations",
      "Remove unused declarations (functions, classes, etc.)",
    )
    .option("--unused-files", "Remove unused files")
    .option("--unused-dependencies", "Check for unused dependencies")
    .option(
      "--remove-unused-dependencies",
      "Remove unused dependencies from package.json",
    )
    .option("--remove-console", "Remove console logs")
    .option("--remove-comments", "Remove comments")
    .option("--remove-empty", "Remove empty files and folders")
    .option("--format", "Format files with Prettier")
    .option("--restore", "Restore from a backup")
    .option("--no-backup", "Disable automatic backup")
    .option("--git-aware", "Skip files with uncommitted changes")
    .option("--diff", "Show diff of changes in preview mode")
    .option("--output <file>", "Output report to file")
    .option("--report-format <format>", "Report format (json, html, markdown)", "markdown");

  // For backward compatibility, keep the old behavior as default
  program.action(async () => {
    console.log(
      "Please use 'purgecode init' to initialize or specify a command.",
    );
    console.log("Available commands:");
    console.log("  init    Initialize purgecode configuration");
    console.log("Run 'purgecode <command> --help' for more information.");
  });

  program.action(async (options) => {
    const { pruneCommand } = await import("./commands/prune.js");
    await pruneCommand(options);
  });

  program.parse(process.argv);
}
