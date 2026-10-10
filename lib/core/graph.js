import path from "path";
import { SyntaxKind, Node } from "ts-morph";
export function findUnusedFiles(project, entryPoints = []) {
    const sourceFiles = project.getSourceFiles();
    const allFilePaths = new Set(sourceFiles.map((sf) => sf.getFilePath()));
    const visited = new Set();
    const queue = [];
    // 1. Identify Entry Points
    const entryPatterns = ["index", "main", "app", "entry", "server", "cli"];
    // Add explicit entry points
    entryPoints.forEach(ep => {
        const sf = project.getSourceFile(ep);
        if (sf)
            queue.push(sf.getFilePath());
    });
    // Auto-detect entry points if none provided or to supplement
    for (const sf of sourceFiles) {
        const filePath = sf.getFilePath();
        const baseName = path.basename(filePath, path.extname(filePath));
        if (entryPatterns.includes(baseName.toLowerCase()) || entryPoints.includes(filePath)) {
            queue.push(filePath);
        }
    }
    // 2. BFS Traversal
    while (queue.length > 0) {
        const currentPath = queue.shift();
        if (visited.has(currentPath))
            continue;
        visited.add(currentPath);
        const sourceFile = project.getSourceFile(currentPath);
        if (!sourceFile)
            continue;
        // Collect dependencies
        const dependencies = new Set();
        // Static Imports & Exports
        const imports = sourceFile.getImportDeclarations();
        const exports = sourceFile.getExportDeclarations();
        for (const decl of [...imports, ...exports]) {
            const sourceFileDef = decl.getModuleSpecifierSourceFile();
            if (sourceFileDef) {
                dependencies.add(sourceFileDef.getFilePath());
            }
        }
        // Dynamic Imports: import('./foo')
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const call of callExpressions) {
            const expression = call.getExpression();
            // Check for import('...')
            if (expression.getKind() === SyntaxKind.ImportKeyword) {
                const args = call.getArguments();
                if (args.length > 0 && Node.isStringLiteral(args[0])) {
                    const modulePath = args[0].getLiteralValue();
                    // Resolve path relative to current file
                    const resolvedPath = path.resolve(path.dirname(currentPath), modulePath);
                    // Try to find the file in project (handling extensions)
                    const depFile = project.getSourceFile((f) => {
                        const fPath = f.getFilePath();
                        // Simple check: exact match or with extension
                        return fPath === resolvedPath || fPath.startsWith(resolvedPath + ".");
                    });
                    if (depFile) {
                        dependencies.add(depFile.getFilePath());
                    }
                }
            }
            // Check for require('...')
            if (Node.isIdentifier(expression) && expression.getText() === "require") {
                const args = call.getArguments();
                if (args.length > 0 && Node.isStringLiteral(args[0])) {
                    const modulePath = args[0].getLiteralValue();
                    // Resolve path relative to current file
                    const resolvedPath = path.resolve(path.dirname(currentPath), modulePath);
                    const depFile = project.getSourceFile((f) => {
                        const fPath = f.getFilePath();
                        return fPath === resolvedPath || fPath.startsWith(resolvedPath + ".");
                    });
                    if (depFile) {
                        dependencies.add(depFile.getFilePath());
                    }
                }
            }
        }
        // Add unvisited dependencies to queue
        for (const dep of dependencies) {
            if (!visited.has(dep)) {
                queue.push(dep);
            }
        }
    }
    // 3. Calculate Unused Files
    return [...allFilePaths].filter((filePath) => !visited.has(filePath));
}
