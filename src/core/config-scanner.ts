import fs from "fs/promises";
import path from "path";
import { glob } from "glob";

export async function scanConfigFiles(rootDir: string): Promise<string[]> {
    const detectedFiles = new Set<string>();

    // 1. package.json
    try {
        const pkgPath = path.join(rootDir, "package.json");
        const pkgContent = await fs.readFile(pkgPath, "utf-8");
        const pkg = JSON.parse(pkgContent);

        if (pkg.main) detectedFiles.add(path.resolve(rootDir, pkg.main));
        if (pkg.module) detectedFiles.add(path.resolve(rootDir, pkg.module));
        if (pkg.types) detectedFiles.add(path.resolve(rootDir, pkg.types));
        if (pkg.typings) detectedFiles.add(path.resolve(rootDir, pkg.typings));
        if (pkg.bin) {
            if (typeof pkg.bin === "string") {
                detectedFiles.add(path.resolve(rootDir, pkg.bin));
            } else if (typeof pkg.bin === "object") {
                Object.values(pkg.bin).forEach((binPath) => {
                    if (typeof binPath === "string") {
                        detectedFiles.add(path.resolve(rootDir, binPath));
                    }
                });
            }
        }
        // TODO: Parse scripts for file paths?
    } catch (e) {
        // Ignore if package.json doesn't exist or is invalid
    }

    // 2. tsconfig.json
    try {
        const tsConfigPath = path.join(rootDir, "tsconfig.json");
        const tsConfigContent = await fs.readFile(tsConfigPath, "utf-8");
        // Simple JSON parse (might fail with comments, but standard JSON is expected for now)
        // For robust parsing we might need 'strip-json-comments' or similar, but let's try basic JSON first.
        // Or use ts-morph to read it?
        // ts-morph Project can load tsconfig.
        // But here we just want to find "files" or "include" that might be entry points.
        // Actually, ts-morph's project.getSourceFiles() already respects tsconfig 'include'.
        // So we might not need to explicitly add them if we load the project with tsconfig.
        // But 'files' in tsconfig are definitely entry points.
    } catch (e) {
        // Ignore
    }

    // 3. Framework configs (next.config.js, vite.config.ts, etc.)
    // These are usually entry points themselves (if they are JS/TS files).
    const configPatterns = [
        "next.config.{js,ts,mjs}",
        "vite.config.{js,ts,mjs}",
        "webpack.config.{js,ts,mjs}",
        "rollup.config.{js,ts,mjs}",
        "jest.config.{js,ts,mjs}",
        "vitest.config.{js,ts,mjs}",
        "eslint.config.{js,ts,mjs}",
        "prettier.config.{js,ts,mjs}",
        "postcss.config.{js,ts,mjs}",
        "tailwind.config.{js,ts,mjs}",
    ];

    const configFiles = await glob(configPatterns, { cwd: rootDir, absolute: true });
    configFiles.forEach(f => detectedFiles.add(f));

    return Array.from(detectedFiles);
}
