// import chalk from "chalk";
import path from "path";
import { Project } from "ts-morph";
import { findUnusedFiles } from "../../core/graph.js";
import { scanFiles } from "../../core/analyzer.js";
import { loadConfig } from "../../utils/config.js";
import { logger, spinner } from "../../utils/index.js";
import fs from "fs/promises";
export async function listCommand(options) {
    const cwd = process.cwd();
    const config = await loadConfig(cwd);
    if (!options.json) {
        spinner.start("Scanning files...");
    }
    const files = await scanFiles(cwd, config);
    if (files.length === 0) {
        if (options.json) {
            console.log(JSON.stringify([]));
        }
        else {
            spinner.stop();
            logger.warn("No files found matching the configuration.");
        }
        return;
    }
    const project = new Project({
        skipAddingFilesFromTsConfig: true,
        compilerOptions: {
            allowJs: true,
            jsx: 2,
            strict: false,
            noImplicitAny: false,
            skipLibCheck: true,
            moduleResolution: 2,
        },
    });
    files.forEach((file) => project.addSourceFileAtPath(file));
    if (!options.json) {
        spinner.succeed(`Analyzed ${files.length} files.`);
    }
    let unusedFiles = findUnusedFiles(project);
    // Filter out files with ignore comments
    unusedFiles = await Promise.all(unusedFiles.map(async (filePath) => {
        const content = await fs.readFile(filePath, "utf-8");
        return config.ignoreComments.some((comment) => content.includes(comment))
            ? null
            : filePath;
    })).then((results) => results.filter(Boolean));
    if (options.json) {
        console.log(JSON.stringify(unusedFiles.map(f => path.relative(cwd, f)), null, 2));
    }
    else {
        if (unusedFiles.length > 0) {
            logger.info(`Found ${unusedFiles.length} unused files:`);
            unusedFiles.forEach((f) => console.log(`  - ${path.relative(cwd, f)}`));
        }
        else {
            logger.success("No unused files found!");
        }
    }
}
