import chalk from "chalk";
import { exec } from "child_process";
import fs from "fs/promises";
import inquirer from "inquirer";
import path from "path";
import { Project } from "ts-morph";
import util from "util";
import { createBackup, restoreBackup } from "../../utils/backup.js";
import {
  generateConfigFile,
  loadConfig,
  mergeConfig,
} from "../../utils/config.js";
import {
  checkUnusedDependencies,
  removeDependencies,
  removeUnusedDependencies,
} from "../../core/dependencies.js";
import { findUnusedFiles } from "../../core/graph.js";
import {
  formatFile,
  removeComments,
  removeConsole,
  removeEmptyFilesAndFolders,
  removeUnusedDeclarations,
  removeUnusedImports,
  removeUnusedVariables,
} from "../../core/pruner.js";
import { scanFiles } from "../../core/analyzer.js";
import { logger, spinner } from "../../utils/index.js";

const execAsync = util.promisify(exec);

export async function pruneCommand(options: any) {
  const cwd = process.cwd();
  const pass = options.pass || 0;
  if (pass > 2) {
    logger.info("Maximum passes reached.");
    return;
  }

  // Handle Restore Mode
  if (options.restore) {
    await restoreBackup(cwd);
    return;
  }

  const config = await loadConfig(cwd);

  // Generate config file if it doesn't exist
  const configPath = path.join(cwd, "purgecode.config.json");
  let configExists = true;
  try {
    await fs.access(configPath);
  } catch {
    configExists = false;
  }

  if (!configExists) {
    const { createConfig } = await inquirer.prompt([
      {
        type: "confirm",
        name: "createConfig",
        message: chalk.yellow("Configuration file not found. Do you want to create one? (purgecode.config.json)"),
        default: true,
      },
    ]);

    if (createConfig) {
      await generateConfigFile(cwd);
    }
  }

  const finalConfig = mergeConfig(config, options);

  // Determine mode
  const hasExplicitActionFlags =
    options.unusedImports ||
    options.unusedVariables ||
    options.unusedDeclarations ||
    options.unusedFiles ||
    options.unusedDependencies ||
    options.removeUnusedDependencies ||
    options.removeConsole ||
    options.removeComments ||
    options.removeEmpty ||
    options.format;

  // If we have stored selections from a previous pass, skip interactive mode
  const isSubsequentPass = pass > 0 && Array.isArray(options.selectedFeatures);
  const shouldRunInteractive = !isSubsequentPass && (options.interactive || !hasExplicitActionFlags);

  let selectedFeatures: string[] = [];
  let isPreview = finalConfig.previewMode;
  let shouldBackup = options.backup !== false; // Default true unless --no-backup

  if (shouldRunInteractive) {
    // Show git commit warning
    console.log("\n" + chalk.bold.yellow("⚠️  IMPORTANT SAFETY REMINDER\n"));
    console.log(chalk.yellow("Before proceeding, please ensure you have committed your changes to Git!"));
    console.log(chalk.yellow("This allows you to easily revert if something goes wrong.\n"));
    console.log(chalk.dim("Run: ") + chalk.bold("git add . && git commit -m 'Before purgecode cleanup'\n"));

    console.log(chalk.bold.cyan("🧹 PurgeCode - Code Cleanup Tasks\n"));

    const answers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "features",
        message: chalk.cyan("Select cleanup tasks to perform:"),
        choices: [
          {
            name: chalk.green("📦 Remove Unused Imports") + chalk.dim(" (.ts, .js, .tsx, .jsx)"),
            value: "unusedImports",
            checked: finalConfig.removeUnusedImports,
          },
          {
            name: chalk.green("🔤 Remove Unused Variables") + chalk.dim(" (local scope)"),
            value: "unusedVariables",
            checked: false,
          },
          {
            name: chalk.green("⚙️  Remove Unused Declarations") + chalk.dim(" (functions, classes)"),
            value: "unusedDeclarations",
            checked: false,
          },
          {
            name: chalk.green("📄 Remove Unused Files") + chalk.dim(" (.ts, .js, .tsx, .jsx)"),
            value: "unusedFiles",
            checked: finalConfig.removeUnusedFiles,
          },
          {
            name: chalk.blue("📊 Check Unused Dependencies") + chalk.dim(" (npm packages)"),
            value: "unusedDependencies",
            checked: false,
          },
          {
            name: chalk.blue("🗑️  Remove Unused Dependencies") + chalk.dim(" (from package.json)"),
            value: "removeUnusedDependencies",
            checked: false,
          },
          {
            name: chalk.magenta("🖨️  Remove Console Logs") + chalk.dim(" (console.log, warn, error)"),
            value: "removeConsole",
            checked: finalConfig.removeConsole,
          },
          {
            name: chalk.magenta("💬 Remove Comments") + chalk.dim(" (// and /* */)"),
            value: "removeComments",
            checked: finalConfig.removeComments,
          },
          {
            name: chalk.red("🧹 Remove Empty Files & Folders") + chalk.dim(" (cleanup)"),
            value: "removeEmpty",
            checked: finalConfig.removeEmpty,
          },
          {
            name: chalk.cyan("✨ Format with Prettier") + chalk.dim(" (code formatting)"),
            value: "format",
            checked: finalConfig.formatWithPrettier,
          },
        ],
      },
      {
        type: "confirm",
        name: "backup",
        message: chalk.cyan("📦 Create a backup before purging?"),
        default: true,
      },
      {
        type: "confirm",
        name: "preview",
        message: chalk.cyan("👁️  Run in Preview Mode? (no changes will be written)"),
        default: finalConfig.previewMode,
      },
    ]);

    selectedFeatures = answers.features;
    isPreview = answers.preview;
    shouldBackup = answers.backup;

    // Store choices for subsequent passes
    options.selectedFeatures = selectedFeatures;
    options.previewMode = isPreview;
    options.backup = shouldBackup;
    options.interactive = false;
  } else if (options.selectedFeatures) {
    // Use stored choices from previous pass
    selectedFeatures = options.selectedFeatures;
    isPreview = options.previewMode;
  } else {
    if (finalConfig.removeUnusedImports) selectedFeatures.push("unusedImports");
    if (options.unusedVariables) selectedFeatures.push("unusedVariables");
    if (options.unusedDeclarations) selectedFeatures.push("unusedDeclarations");
    if (finalConfig.removeUnusedFiles) selectedFeatures.push("unusedFiles");
    if (options.unusedDependencies) selectedFeatures.push("unusedDependencies");
    if (options.removeUnusedDependencies)
      selectedFeatures.push("removeUnusedDependencies");
    if (finalConfig.removeConsole) selectedFeatures.push("removeConsole");
    if (finalConfig.removeComments) selectedFeatures.push("removeComments");
    if (options.removeEmpty) selectedFeatures.push("removeEmpty");
    if (finalConfig.formatWithPrettier) selectedFeatures.push("format");
  }

  if (isPreview) {
    logger.info("Running in PREVIEW mode. No files will be modified.");
  }

  spinner.start("Scanning files...");
  let files = await scanFiles(cwd, finalConfig);
  spinner.succeed(`Found ${files.length} files.`);

  // Git-aware mode: Skip modified/staged files
  if (options.gitAware || finalConfig.git?.skipTrackedFiles) {
    const isGit = await import("../../utils/git.js").then((m) =>
      m.isGitRepo(cwd),
    );
    if (isGit) {
      spinner.start("Checking git status...");
      const dirtyFiles = await import("../../utils/git.js").then((m) =>
        m.getDirtyFiles(cwd),
      );
      const initialCount = files.length;
      files = files.filter((f) => !dirtyFiles.includes(f));
      const skippedCount = initialCount - files.length;
      spinner.succeed(
        `Git-aware: Skipped ${skippedCount} modified/staged files.`,
      );
    }
  }

  if (files.length === 0) {
    logger.warn("No files found matching the configuration.");
    return;
  }

  // Ensure entryPoints exists
  if (!finalConfig.entryPoints) {
    finalConfig.entryPoints = [];
  }

  // 4. Scan config files for additional entry points
  if (finalConfig.analysis?.scanConfigFiles) {
    spinner.text = "Scanning config files for entry points...";
    const { scanConfigFiles } = await import("../../core/config-scanner.js");
    const configEntryPoints = await scanConfigFiles(cwd);
    if (configEntryPoints.length > 0) {
      logger.info(
        `Detected ${configEntryPoints.length} entry points from config files.`,
      );
      // Add to entryPoints if not already present
      configEntryPoints.forEach((ep) => {
        if (!finalConfig.entryPoints!.includes(ep)) {
          finalConfig.entryPoints!.push(ep);
        }
      });
    }
  }

  // 5. Initialize Project
  spinner.text = "Analyzing project structure...";
  const tsConfigPath = path.join(cwd, "tsconfig.json");
  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: false,
    compilerOptions: {
      allowJs: true,
      jsx: 2, // React
      strict: false,
      noImplicitAny: false,
      skipLibCheck: true,
      moduleResolution: 2, // Node
    },
  });

  files.forEach((file) => project.addSourceFileAtPath(file));
  spinner.succeed("Project initialized.");

  // Debug: List loaded files
  // project.getSourceFiles().forEach(sf => console.log(`Loaded: ${sf.getFilePath()}`));

  // --- Analysis & Transformation ---
  let unusedImportsCount = 0;
  let unusedVariablesCount = 0;
  let unusedDeclarationsCount = 0;
  let consoleRemovedCount = 0;
  let commentsRemovedCount = 0;
  let unusedFiles: string[] = [];
  let unusedDeps: string[] = [];
  let removedDepsCount = 0;
  let emptyFilesRemoved = 0;
  let emptyFoldersRemoved = 0;

  // 1. Unused Files
  if (selectedFeatures.includes("unusedFiles")) {
    unusedFiles = findUnusedFiles(project);
    // Filter out files with ignore comments
    unusedFiles = await Promise.all(
      unusedFiles.map(async (filePath) => {
        const content = await fs.readFile(filePath, "utf-8");
        return finalConfig.ignoreComments.some((comment) =>
          content.includes(comment),
        )
          ? null
          : filePath;
      }),
    ).then((results) => results.filter(Boolean) as string[]);
    if (unusedFiles.length > 0) {
      logger.info(`Unused files detected (${unusedFiles.length}):`);
      unusedFiles.forEach((f) =>
        console.log(chalk.gray(`  - ${path.relative(cwd, f)}`)),
      );
    }
  }

  // 2. Unused Dependencies
  if (
    selectedFeatures.includes("unusedDependencies") ||
    selectedFeatures.includes("removeUnusedDependencies")
  ) {
    spinner.start("Checking dependencies...");
    unusedDeps = await checkUnusedDependencies(
      cwd,
      project
        .getSourceFiles()
        .filter(
          (sf) =>
            !finalConfig.ignoreComments.some((comment) =>
              sf.getFullText().includes(comment),
            ),
        ),
    );
    spinner.stop();
    if (unusedDeps.length > 0) {
      logger.info(`Unused dependencies detected (${unusedDeps.length}):`);
      unusedDeps.forEach((d) => console.log(chalk.yellow(`  - ${d}`)));
    } else {
      logger.success("No unused dependencies found.");
    }
  }

  // 3. AST Transformations
  // Resolve prettier config once to avoid repeated file system searches
  let prettierConfig: any = null;
  if (selectedFeatures.includes("format")) {
    try {
      prettierConfig = await import("prettier").then((p) =>
        p.default.resolveConfig(cwd),
      );
    } catch {
      prettierConfig = {};
    }
  }

  let fileIndex = 0;
  for (const sourceFile of project.getSourceFiles()) {
    fileIndex++;

    // Skip files with ignore comments
    const content = sourceFile.getFullText();
    const hasIgnore = finalConfig.ignoreComments.some((comment) =>
      content.includes(comment),
    );
    if (hasIgnore) continue;

    const originalContent = sourceFile.getFullText();

    if (selectedFeatures.includes("unusedImports")) {
      unusedImportsCount += removeUnusedImports(sourceFile);
    }
    if (selectedFeatures.includes("unusedVariables")) {
      unusedVariablesCount += removeUnusedVariables(sourceFile);
    }
    if (selectedFeatures.includes("unusedDeclarations")) {
      unusedDeclarationsCount += removeUnusedDeclarations(sourceFile);
    }
    if (selectedFeatures.includes("removeConsole")) {
      consoleRemovedCount += removeConsole(sourceFile);
    }
    if (selectedFeatures.includes("removeComments")) {
      commentsRemovedCount += removeComments(sourceFile);
    }
    if (selectedFeatures.includes("format")) {
      await formatFile(sourceFile, prettierConfig);
    }

    if (options.diff && isPreview) {
      const newContent = sourceFile.getFullText();
      if (originalContent !== newContent) {
        const { generateDiff } = await import("../../utils/diff.js");
        console.log(
          generateDiff(sourceFile.getFilePath(), originalContent, newContent),
        );
      }
    }
  }

  // --- Execution / Reporting ---
  const changesMade =
    unusedImportsCount +
    unusedVariablesCount +
    unusedDeclarationsCount +
    consoleRemovedCount +
    commentsRemovedCount +
    removedDepsCount >
    0;

  if (isPreview) {
    console.log("\n" + chalk.bold.cyan("📋 Preview - Summary of Potential Changes:\n"));
    if (unusedImportsCount > 0) console.log(chalk.green(`  ✓ Unused imports to remove: ${unusedImportsCount}`));
    if (unusedVariablesCount > 0) console.log(chalk.green(`  ✓ Unused variables to remove: ${unusedVariablesCount}`));
    if (unusedDeclarationsCount > 0) console.log(chalk.green(`  ✓ Unused declarations to remove: ${unusedDeclarationsCount}`));
    if (consoleRemovedCount > 0) console.log(chalk.green(`  ✓ Console logs to remove: ${consoleRemovedCount}`));
    if (commentsRemovedCount > 0) console.log(chalk.green(`  ✓ Comments to remove: ${commentsRemovedCount}`));
    if (unusedFiles.length > 0) console.log(chalk.green(`  ✓ Files to delete: ${unusedFiles.length}`));
    if (unusedDeps.length > 0) console.log(chalk.green(`  ✓ Unused dependencies: ${unusedDeps.length}`));
    if (selectedFeatures.includes("removeUnusedDependencies") && unusedDeps.length > 0) {
      console.log(chalk.green(`  ✓ Unused dependencies to remove: ${unusedDeps.length}`));
    }
    if (selectedFeatures.includes("removeEmpty")) {
      const emptyCount = project
        .getSourceFiles()
        .filter((sf) => sf.getFullText().trim() === "").length;
      if (emptyCount > 0) console.log(chalk.green(`  ✓ Empty files to remove: ${emptyCount}`));
    }
    console.log("\n" + chalk.dim("💡 Tip: Run without --preview flag to apply these changes"));
    console.log(chalk.dim("⚠️  Remember to commit your changes before applying!\n"));
  } else {
    // BACKUP
    // BACKUP
    if (shouldBackup) {
      // Enabled by default
      spinner.start("Creating backup...");
      const backupPath = await createBackup(cwd, files);
      if (backupPath) {
        spinner.succeed(`Backup created at ${path.relative(cwd, backupPath)}`);
      } else {
        spinner.warn("Backup failed or no files to backup.");
      }
    }

    // Remove Unused Dependencies
    if (selectedFeatures.includes("removeUnusedDependencies")) {
      spinner.start("Checking unused dependencies...");
      const unusedDeps = await checkUnusedDependencies(
        cwd,
        project
          .getSourceFiles()
          .filter(
            (sf) =>
              !finalConfig.ignoreComments.some((comment) =>
                sf.getFullText().includes(comment),
              ),
          ),
      );
      spinner.stop();

      if (unusedDeps.length === 0) {
        logger.success("No unused dependencies to remove.");
      } else {
        let depsToRemove = unusedDeps;

        if (shouldRunInteractive) {
          const { selectedDeps } = await inquirer.prompt([
            {
              type: "checkbox",
              name: "selectedDeps",
              message: "Select dependencies to remove:",
              choices: unusedDeps.map((d) => ({
                name: d,
                value: d,
                checked: true,
              })),
            },
          ]);
          depsToRemove = selectedDeps;
        }

        if (depsToRemove.length > 0) {
          spinner.start(`Removing ${depsToRemove.length} dependencies...`);
          removedDepsCount = await removeDependencies(cwd, depsToRemove);
          spinner.succeed(`Removed ${removedDepsCount} unused dependencies.`);
        } else {
          logger.info("No dependencies selected for removal.");
        }
      }
    }

    spinner.start("Applying changes...");

    // Save each file individually to ensure changes are written
    const unsavedFiles = project.getSourceFiles().filter((sf) => !sf.isSaved());
    for (const sourceFile of unsavedFiles) {
      await sourceFile.save();
    }

    spinner.succeed("Changes applied successfully!");

    // Handle file deletion
    if (unusedFiles.length > 0 && selectedFeatures.includes("unusedFiles")) {
      if (shouldRunInteractive) {
        const { filesToDelete } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "filesToDelete",
            message: "Select files to delete:",
            choices: unusedFiles.map((f) => ({
              name: path.relative(cwd, f),
              value: f,
              checked: true,
            })),
          },
        ]);

        if (filesToDelete.length > 0) {
          const { confirmDelete } = await inquirer.prompt([
            {
              type: "confirm",
              name: "confirmDelete",
              message: `Permanently delete ${filesToDelete.length} files?`,
              default: false,
            },
          ]);

          if (confirmDelete) {
            await Promise.all(filesToDelete.map((f: string) => fs.unlink(f)));
            logger.success(`Deleted ${filesToDelete.length} files.`);
          } else {
            logger.info("Skipped file deletion.");
          }
        } else {
          logger.info("No files selected for deletion.");
        }
      } else {
        logger.warn(
          `Skipping actual deletion of ${unusedFiles.length} files (use interactive mode to delete).`,
        );
      }
    }

    // Summary
    console.log("\n" + chalk.bold.green("✨ Cleanup Complete - Summary:\n"));
    if (unusedImportsCount > 0)
      console.log(chalk.green(`  ✓ Removed unused imports: ${unusedImportsCount}`));
    if (unusedVariablesCount > 0)
      console.log(chalk.green(`  ✓ Removed unused variables: ${unusedVariablesCount}`));
    if (unusedDeclarationsCount > 0)
      console.log(
        chalk.green(`  ✓ Removed unused declarations: ${unusedDeclarationsCount}`),
      );
    if (consoleRemovedCount > 0)
      console.log(chalk.green(`  ✓ Removed console logs: ${consoleRemovedCount}`));
    if (commentsRemovedCount > 0)
      console.log(chalk.green(`  ✓ Removed comments: ${commentsRemovedCount}`));
    if (unusedDeps.length > 0)
      console.log(chalk.green(`  ✓ Unused dependencies found: ${unusedDeps.length}`));
    if (removedDepsCount > 0)
      console.log(chalk.green(`  ✓ Removed unused dependencies: ${removedDepsCount}`));

    // Run lint if available
    try {
      const packageJsonPath = path.join(cwd, "package.json");
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8"),
      );
      if (packageJson.scripts && packageJson.scripts.lint) {
        spinner.start("Running lint...");
        await execAsync("npm run lint", { cwd });
        spinner.succeed("Lint completed successfully.");
      }
    } catch (error) {
      logger.warn("Lint failed or not configured.");
    }

    let emptyFilesRemoved = 0;
    let emptyFoldersRemoved = 0;
    if (selectedFeatures.includes("removeEmpty")) {
      spinner.start("Removing empty files and folders...");
      const { filesRemoved, foldersRemoved } = await removeEmptyFilesAndFolders(
        cwd,
        finalConfig.ignorePaths,
      );
      spinner.succeed(
        `Removed ${filesRemoved} empty files and ${foldersRemoved} empty folders.`,
      );
      if (filesRemoved > 0 || foldersRemoved > 0) {
        console.log(`  - Removed empty files: ${filesRemoved}`);
        console.log(`  - Removed empty folders: ${foldersRemoved}`);
      }
      emptyFilesRemoved = filesRemoved;
      emptyFoldersRemoved = foldersRemoved;
    }

    if (options.output) {
      const { generateReport } = await import("../../core/reporter.js");
      const report = generateReport(
        {
          unusedFiles,
          unusedImports: unusedImportsCount,
          unusedVariables: unusedVariablesCount,
          unusedDeclarations: unusedDeclarationsCount,
          consoleRemoved: consoleRemovedCount,
          commentsRemoved: commentsRemovedCount,
          unusedDeps,
          removedDeps: removedDepsCount,
          emptyFilesRemoved,
          emptyFoldersRemoved,
        },
        options.reportFormat || "markdown",
      );
      await fs.writeFile(options.output, report);
      logger.success(`Report saved to ${options.output}`);
    }

    if (changesMade && pass < 2) {
      logger.info("Changes detected, running another pass...");
      options.pass = pass + 1;
      await pruneCommand(options);
    } else {
      console.log("\n" + chalk.bold.yellow("🔒 NEXT STEPS:\n"));
      console.log(chalk.yellow("1. Review the changes made"));
      console.log(chalk.yellow("2. Run tests to ensure everything works"));
      console.log(chalk.yellow("3. Commit your changes: ") + chalk.bold("git add . && git commit -m 'Code cleanup with purgecode'"));
      console.log(chalk.dim("\n✨ Your code is now cleaner and more maintainable!\n"));
    }
  }
}
