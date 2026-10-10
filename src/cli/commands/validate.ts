import { logger } from "../../utils/index.js";
import { loadConfig } from "../../utils/config.js";

export async function validateCommand() {
    const cwd = process.cwd();
    try {
        const config = await loadConfig(cwd);
        const errors: string[] = [];

        if (!Array.isArray(config.include)) {
            errors.push("Config 'include' must be an array of strings.");
        }

        if (config.exclude && !Array.isArray(config.exclude)) {
            errors.push("Config 'exclude' must be an array of strings.");
        }

        if (config.entryPoints && !Array.isArray(config.entryPoints)) {
            errors.push("Config 'entryPoints' must be an array of strings.");
        }

        if (config.git && typeof config.git !== "object") {
            errors.push("Config 'git' must be an object.");
        }

        if (config.analysis && typeof config.analysis !== "object") {
            errors.push("Config 'analysis' must be an object.");
        }

        if (errors.length > 0) {
            logger.error("Config validation failed:");
            errors.forEach((err) => logger.error(`  - ${err}`));
            process.exit(1);
        } else {
            logger.success("Config is valid!");
        }
    } catch (error) {
        logger.error("Could not load config file.");
        console.error(error);
        process.exit(1);
    }
}
