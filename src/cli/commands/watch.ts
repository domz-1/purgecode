import chokidar from "chokidar";
// import chalk from "chalk";
import path from "path";
import { Project } from "ts-morph";
import { findUnusedFiles } from "../../core/graph.js";
import { scanFiles } from "../../core/analyzer.js";
import { loadConfig } from "../../utils/config.js";
import { logger } from "../../utils/index.js";
import fs from "fs/promises";

export async function watchCommand() {
    const cwd = process.cwd();
    const config = await loadConfig(cwd);

    logger.info("Starting watch mode...");
    logger.info("Press Ctrl+C to exit.");

    let isRunning = false;
    let timeout: NodeJS.Timeout | null = null;

    const runAnalysis = async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            console.clear();
            logger.info("File change detected. Re-analyzing...");

            const files = await scanFiles(cwd, config);

            if (files.length === 0) {
                logger.warn("No files found matching the configuration.");
                isRunning = false;
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

            let unusedFiles = findUnusedFiles(project);

            // Filter out files with ignore comments
            unusedFiles = await Promise.all(
                unusedFiles.map(async (filePath) => {
                    try {
                        const content = await fs.readFile(filePath, "utf-8");
                        return config.ignoreComments.some((comment) =>
                            content.includes(comment),
                        )
                            ? null
                            : filePath;
                    } catch {
                        return null;
                    }
                }),
            ).then((results) => results.filter(Boolean) as string[]);

            if (unusedFiles.length > 0) {
                logger.info(`Found ${unusedFiles.length} unused files:`);
                unusedFiles.forEach((f) =>
                    console.log(`  - ${path.relative(cwd, f)}`),
                );
            } else {
                logger.success("No unused files found!");
            }

            logger.info("\nWaiting for changes...");

        } catch (error) {
            logger.error(`Analysis failed: ${error}`);
        } finally {
            isRunning = false;
        }
    };

    const debounceAnalysis = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(runAnalysis, 500);
    };

    const watcher = chokidar.watch(config.include || [], {
        ignored: [...(config.exclude || []), "**/node_modules/**", "**/.git/**"],
        persistent: true,
        ignoreInitial: false, // Run on start
        cwd: cwd
    });

    watcher
        .on("add", debounceAnalysis)
        .on("change", debounceAnalysis)
        .on("unlink", debounceAnalysis);
}
