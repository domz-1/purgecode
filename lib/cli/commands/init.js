import fs from "fs/promises";
import path from "path";
import inquirer from "inquirer";
// import chalk from "chalk";
import { logger } from "../../utils/index.js";
const DEFAULT_CONFIG = {
    include: ["src/**/*.{ts,tsx,js,jsx}"],
    exclude: [
        "node_modules/**",
        "dist/**",
        "build/**",
        "**/*.test.{ts,js}",
        "**/*.spec.{ts,js}",
    ],
    entryPoints: [],
    dryRun: true,
    reportFormat: "markdown",
    git: {
        respectGitignore: true,
        skipTrackedFiles: false,
    },
    analysis: {
        followDynamicImports: true,
        checkBarrelExports: true,
        scanConfigFiles: true,
    },
};
export async function initCommand() {
    const cwd = process.cwd();
    const configPath = path.join(cwd, "purgecode.config.json");
    const ignorePath = path.join(cwd, ".codepruneignore");
    console.log("\n" + "⚙️  Initializing PurgeCode Configuration\n");
    try {
        await fs.access(configPath);
        const { overwrite } = await inquirer.prompt([
            {
                type: "confirm",
                name: "overwrite",
                message: "⚠️  purgecode.config.json already exists. Overwrite?",
                default: false,
            },
        ]);
        if (!overwrite) {
            logger.info("❌ Initialization aborted.");
            return;
        }
    }
    catch {
        // Config doesn't exist, proceed
    }
    const packageJsonPath = path.join(cwd, "package.json");
    let packageJson = {};
    try {
        packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    }
    catch {
        // No package.json
    }
    const answers = await inquirer.prompt([
        {
            type: "list",
            name: "projectType",
            message: "📦 What type of project is this?",
            choices: [
                { name: "Node.js" + " - Backend/CLI projects", value: "Node.js" },
                { name: "React" + " - React applications", value: "React" },
                { name: "Vue" + " - Vue.js applications", value: "Vue" },
                { name: "Next.js" + " - Next.js full-stack apps", value: "Next.js" },
                { name: "Other" + " - Custom setup", value: "Other" },
            ],
            default: "Node.js",
        },
        {
            type: "input",
            name: "srcDir",
            message: "📁 Where are your source files located?",
            default: "src",
        },
        {
            type: "confirm",
            name: "gitAware",
            message: "🔒 Enable Git-aware mode (skip modified/staged files)?",
            default: true,
        },
        {
            type: "confirm",
            name: "dryRun",
            message: "👁️  Enable dry-run by default (preview changes)?",
            default: true,
        },
    ]);
    const config = { ...DEFAULT_CONFIG };
    // Adjust include patterns based on source dir and project type
    const srcDir = answers.srcDir || "src";
    const extensions = "{ts,tsx,js,jsx}";
    if (answers.projectType === "Vue") {
        config.include = [`${srcDir}/**/*.{ts,js,vue}`];
    }
    else {
        config.include = [`${srcDir}/**/*.${extensions}`];
    }
    // Adjust excludes
    if (answers.projectType === "Next.js") {
        config.exclude.push(".next/**");
    }
    config.git.skipTrackedFiles = answers.gitAware;
    config.dryRun = answers.dryRun;
    // Auto-detect entry points
    const entryPoints = [];
    if (packageJson.main)
        entryPoints.push(packageJson.main);
    if (packageJson.module)
        entryPoints.push(packageJson.module);
    if (packageJson.bin) {
        if (typeof packageJson.bin === "string") {
            entryPoints.push(packageJson.bin);
        }
        else {
            entryPoints.push(...Object.values(packageJson.bin));
        }
    }
    // Common entry patterns
    const commonEntries = [
        `${srcDir}/index.${extensions}`,
        `${srcDir}/main.${extensions}`,
        `${srcDir}/app.${extensions}`,
        `index.${extensions}`,
        `server.js`,
        `app.js`,
    ];
    // We won't check existence here to keep it fast, just add what we found in package.json
    // and maybe some very obvious ones if the user wants, but for now let's stick to package.json + manual
    if (entryPoints.length > 0) {
        config.entryPoints = entryPoints;
    }
    else {
        // If no entry points found, maybe ask user?
        // For now, let's leave it empty or add a default src/index.ts
        config.entryPoints = [`${srcDir}/index.ts`];
    }
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    logger.success("✅ Created purgecode.config.json");
    // Create .codepruneignore if it doesn't exist
    try {
        await fs.access(ignorePath);
    }
    catch {
        const defaultIgnore = `
node_modules
dist
build
coverage
.git
    `.trim();
        await fs.writeFile(ignorePath, defaultIgnore);
        logger.success("✅ Created .codepruneignore");
    }
    console.log("\n" + "🎉 Configuration initialized successfully!\n");
    console.log("Next steps:");
    console.log("  1. Review purgecode.config.json");
    console.log("  2. Run: " + "purgecode prune");
    console.log("\n💡 Tip: Always commit your changes before running purgecode for safety!\n");
}
