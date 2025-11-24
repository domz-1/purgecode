import chalk from "chalk";
import { exec } from "child_process";
import { Command } from "commander";
import fs from "fs/promises";
import inquirer from "inquirer";
import path from "path";
import { Project } from "ts-morph";
import util from "util";
import { createBackup, restoreBackup } from "./backup.js";
import { generateConfigFile, loadConfig, mergeConfig } from "./config.js";
import { checkUnusedDependencies, removeUnusedDependencies, } from "./dependencies.js";
import { findUnusedFiles } from "./graph.js";
import { formatFile, removeComments, removeConsole, removeEmptyFilesAndFolders, removeUnusedDeclarations, removeUnusedImports, removeUnusedVariables, } from "./operations.js";
import { scanFiles } from "./scanner.js";
import { logger, spinner } from "./utils.js";
const program = new Command();
const execAsync = util.promisify(exec);
export default async function main() {
    program
        .name("codeprune")
        .description("A CLI tool to clean and prune your codebase")
        .version("1.0.0")
        .option("-i, --interactive", "Run in interactive mode")
        .option("--preview", "Run in preview mode (no changes)")
        .option("--unused-imports", "Remove unused imports")
        .option("--unused-variables", "Remove unused variables")
        .option("--unused-declarations", "Remove unused declarations (functions, classes, etc.)")
        .option("--unused-files", "Remove unused files")
        .option("--unused-dependencies", "Check for unused dependencies")
        .option("--remove-unused-dependencies", "Remove unused dependencies from package.json")
        .option("--remove-console", "Remove console logs")
        .option("--remove-comments", "Remove comments")
        .option("--remove-empty", "Remove empty files and folders")
        .option("--format", "Format files with Prettier")
        .option("--restore", "Restore from a backup")
        .option("--no-backup", "Disable automatic backup");
    program.action(async (options) => {
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
        await generateConfigFile(cwd);
        const finalConfig = mergeConfig(config, options);
        // Determine mode
        const hasExplicitActionFlags = options.unusedImports ||
            options.unusedVariables ||
            options.unusedDeclarations ||
            options.unusedFiles ||
            options.unusedDependencies ||
            options.removeUnusedDependencies ||
            options.removeConsole ||
            options.removeComments ||
            options.removeEmpty ||
            options.format;
        const shouldRunInteractive = options.interactive || !hasExplicitActionFlags;
        let selectedFeatures = [];
        let isPreview = finalConfig.previewMode;
        if (shouldRunInteractive) {
            console.log(chalk.bold.blue("Welcome to CodePrune!"));
            const answers = await inquirer.prompt([
                {
                    type: "checkbox",
                    name: "features",
                    message: "Which cleanup tasks would you like to perform?",
                    choices: [
                        {
                            name: "Remove Unused Imports",
                            value: "unusedImports",
                            checked: finalConfig.removeUnusedImports,
                        },
                        {
                            name: "Remove Unused Variables",
                            value: "unusedVariables",
                            checked: false,
                        },
                        {
                            name: "Remove Unused Declarations",
                            value: "unusedDeclarations",
                            checked: false,
                        },
                        {
                            name: "Remove Unused Files",
                            value: "unusedFiles",
                            checked: finalConfig.removeUnusedFiles,
                        },
                        {
                            name: "Check Unused Dependencies",
                            value: "unusedDependencies",
                            checked: false,
                        },
                        {
                            name: "Remove Unused Dependencies",
                            value: "removeUnusedDependencies",
                            checked: false,
                        },
                        {
                            name: "Remove Console Logs",
                            value: "removeConsole",
                            checked: finalConfig.removeConsole,
                        },
                        {
                            name: "Remove Comments",
                            value: "removeComments",
                            checked: finalConfig.removeComments,
                        },
                        {
                            name: "Remove Empty Files and Folders",
                            value: "removeEmpty",
                            checked: finalConfig.removeEmpty,
                        },
                        {
                            name: "Format with Prettier",
                            value: "format",
                            checked: finalConfig.formatWithPrettier,
                        },
                    ],
                },
                {
                    type: "confirm",
                    name: "preview",
                    message: "Run in Preview Mode? (No changes will be written)",
                    default: finalConfig.previewMode,
                },
            ]);
            selectedFeatures = answers.features;
            isPreview = answers.preview;
        }
        else {
            if (finalConfig.removeUnusedImports)
                selectedFeatures.push("unusedImports");
            if (options.unusedVariables)
                selectedFeatures.push("unusedVariables");
            if (options.unusedDeclarations)
                selectedFeatures.push("unusedDeclarations");
            if (finalConfig.removeUnusedFiles)
                selectedFeatures.push("unusedFiles");
            if (options.unusedDependencies)
                selectedFeatures.push("unusedDependencies");
            if (options.removeUnusedDependencies)
                selectedFeatures.push("removeUnusedDependencies");
            if (finalConfig.removeConsole)
                selectedFeatures.push("removeConsole");
            if (finalConfig.removeComments)
                selectedFeatures.push("removeComments");
            if (options.removeEmpty)
                selectedFeatures.push("removeEmpty");
            if (finalConfig.formatWithPrettier)
                selectedFeatures.push("format");
        }
        if (isPreview) {
            logger.info("Running in PREVIEW mode. No files will be modified.");
        }
        spinner.start("Scanning files...");
        const files = await scanFiles(cwd, finalConfig);
        spinner.succeed(`Found ${files.length} files.`);
        if (files.length === 0) {
            logger.warn("No files found matching the configuration.");
            return;
        }
        // Initialize Project
        const project = new Project({
            skipAddingFilesFromTsConfig: true,
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
        let unusedFiles = [];
        let unusedDeps = [];
        let removedDepsCount = 0;
        // 1. Unused Files
        if (selectedFeatures.includes("unusedFiles")) {
            unusedFiles = findUnusedFiles(project);
            // Filter out files with ignore comments
            unusedFiles = await Promise.all(unusedFiles.map(async (filePath) => {
                const content = await fs.readFile(filePath, "utf-8");
                return finalConfig.ignoreComments.some((comment) => content.includes(comment))
                    ? null
                    : filePath;
            })).then((results) => results.filter(Boolean));
            if (unusedFiles.length > 0) {
                logger.info(`Unused files detected (${unusedFiles.length}):`);
                unusedFiles.forEach((f) => console.log(chalk.gray(`  - ${path.relative(cwd, f)}`)));
            }
        }
        // 2. Unused Dependencies
        if (selectedFeatures.includes("unusedDependencies") ||
            selectedFeatures.includes("removeUnusedDependencies")) {
            spinner.start("Checking dependencies...");
            unusedDeps = await checkUnusedDependencies(cwd, project
                .getSourceFiles()
                .filter((sf) => !finalConfig.ignoreComments.some((comment) => sf.getFullText().includes(comment))));
            spinner.stop();
            if (unusedDeps.length > 0) {
                logger.info(`Unused dependencies detected (${unusedDeps.length}):`);
                unusedDeps.forEach((d) => console.log(chalk.yellow(`  - ${d}`)));
            }
            else {
                logger.success("No unused dependencies found.");
            }
        }
        // 3. AST Transformations
        // Resolve prettier config once to avoid repeated file system searches
        let prettierConfig = null;
        if (selectedFeatures.includes("format")) {
            try {
                prettierConfig = await import("prettier").then((p) => p.default.resolveConfig(cwd));
            }
            catch {
                prettierConfig = {};
            }
        }
        let fileIndex = 0;
        for (const sourceFile of project.getSourceFiles()) {
            fileIndex++;
            // Skip files with ignore comments
            const content = sourceFile.getFullText();
            const hasIgnore = finalConfig.ignoreComments.some((comment) => content.includes(comment));
            if (hasIgnore)
                continue;
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
        }
        // --- Execution / Reporting ---
        const changesMade = unusedImportsCount +
            unusedVariablesCount +
            unusedDeclarationsCount +
            consoleRemovedCount +
            commentsRemovedCount +
            removedDepsCount >
            0;
        if (isPreview) {
            console.log("\n" + chalk.bold("Summary of potential changes:"));
            console.log(`  - Unused imports to remove: ${unusedImportsCount > 0 ? "Yes" : "0"}`);
            console.log(`  - Unused variables to remove: ${unusedVariablesCount}`);
            console.log(`  - Unused declarations to remove: ${unusedDeclarationsCount}`);
            console.log(`  - Console logs to remove: ${consoleRemovedCount}`);
            console.log(`  - Comments to remove: ${commentsRemovedCount}`);
            console.log(`  - Files to delete: ${unusedFiles.length}`);
            console.log(`  - Unused dependencies: ${unusedDeps.length}`);
            console.log(`  - Unused dependencies to remove: ${selectedFeatures.includes("removeUnusedDependencies") ? unusedDeps.length : 0}`);
            if (selectedFeatures.includes("removeEmpty")) {
                const emptyCount = project
                    .getSourceFiles()
                    .filter((sf) => sf.getFullText().trim() === "").length;
                console.log(`  - Empty files to remove: ${emptyCount}`);
            }
        }
        else {
            // BACKUP
            if (options.backup !== false) {
                // Enabled by default
                spinner.start("Creating backup...");
                const backupPath = await createBackup(cwd, files);
                if (backupPath) {
                    spinner.succeed(`Backup created at ${path.relative(cwd, backupPath)}`);
                }
                else {
                    spinner.warn("Backup failed or no files to backup.");
                }
            }
            // Remove Unused Dependencies
            if (selectedFeatures.includes("removeUnusedDependencies")) {
                spinner.start("Removing unused dependencies...");
                removedDepsCount = await removeUnusedDependencies(cwd, project
                    .getSourceFiles()
                    .filter((sf) => !finalConfig.ignoreComments.some((comment) => sf.getFullText().includes(comment))));
                spinner.succeed(`Removed ${removedDepsCount} unused dependencies.`);
            }
            spinner.start("Applying changes...");
            // Save each file individually to ensure changes are written
            const unsavedFiles = project
                .getSourceFiles()
                .filter((sf) => !sf.isSaved());
            for (const sourceFile of unsavedFiles) {
                await sourceFile.save();
            }
            spinner.succeed("Changes applied successfully!");
            // Handle file deletion
            if (unusedFiles.length > 0 && selectedFeatures.includes("unusedFiles")) {
                if (shouldRunInteractive) {
                    const { confirmDelete } = await inquirer.prompt([
                        {
                            type: "confirm",
                            name: "confirmDelete",
                            message: `Delete ${unusedFiles.length} unused files?`,
                            default: false,
                        },
                    ]);
                    if (confirmDelete) {
                        await Promise.all(unusedFiles.map((f) => fs.unlink(f)));
                        logger.success(`Deleted ${unusedFiles.length} files.`);
                    }
                    else {
                        logger.info("Skipped file deletion.");
                    }
                }
                else {
                    logger.warn(`Skipping actual deletion of ${unusedFiles.length} files (use interactive mode to delete).`);
                }
            }
            // Summary
            console.log("\n" + chalk.bold("Summary:"));
            if (unusedImportsCount > 0)
                console.log(`  - Removed unused imports: ${unusedImportsCount}`);
            if (unusedVariablesCount > 0)
                console.log(`  - Removed unused variables: ${unusedVariablesCount}`);
            if (unusedDeclarationsCount > 0)
                console.log(`  - Removed unused declarations: ${unusedDeclarationsCount}`);
            if (consoleRemovedCount > 0)
                console.log(`  - Removed console logs: ${consoleRemovedCount}`);
            if (commentsRemovedCount > 0)
                console.log(`  - Removed comments: ${commentsRemovedCount}`);
            if (unusedDeps.length > 0)
                console.log(`  - Unused dependencies found: ${unusedDeps.length}`);
            if (removedDepsCount > 0)
                console.log(`  - Removed unused dependencies: ${removedDepsCount}`);
            // Run lint if available
            try {
                const packageJsonPath = path.join(cwd, "package.json");
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
                if (packageJson.scripts && packageJson.scripts.lint) {
                    spinner.start("Running lint...");
                    await execAsync("npm run lint", { cwd });
                    spinner.succeed("Lint completed successfully.");
                }
            }
            catch (error) {
                logger.warn("Lint failed or not configured.");
            }
            if (selectedFeatures.includes("removeEmpty")) {
                spinner.start("Removing empty files and folders...");
                const { filesRemoved, foldersRemoved } = await removeEmptyFilesAndFolders(cwd, finalConfig.ignorePaths);
                spinner.succeed(`Removed ${filesRemoved} empty files and ${foldersRemoved} empty folders.`);
                if (filesRemoved > 0 || foldersRemoved > 0) {
                    console.log(`  - Removed empty files: ${filesRemoved}`);
                    console.log(`  - Removed empty folders: ${foldersRemoved}`);
                }
            }
            if (changesMade && pass < 2) {
                logger.info("Changes detected, running another pass...");
                options.pass = pass + 1;
                await program.action(options);
            }
        }
    });
    program.parse(process.argv);
}
