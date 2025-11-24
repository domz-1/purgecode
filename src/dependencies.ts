import fs from 'fs/promises';
import path from 'path';
import { SourceFile, SyntaxKind } from 'ts-morph';

interface PackageJson {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

export async function checkUnusedDependencies(cwd: string, sourceFiles: SourceFile[]): Promise<string[]> {
    const packageJsonPath = path.join(cwd, 'package.json');
    let packageJson: PackageJson;

    try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(content);
    } catch (error) {
        // No package.json found or invalid
        return [];
    }

    // Only check regular dependencies, not devDependencies
    // DevDependencies (like TypeScript, build tools, type definitions) are typically
    // not imported directly in source code but are still needed for the project
    const allDeps = Object.keys(packageJson.dependencies || {});

    if (allDeps.length === 0) return [];

    const usedDeps = new Set<string>();

    for (const sourceFile of sourceFiles) {
        if (sourceFile.getFilePath().endsWith('components.tsx')) {
            console.log('Content snippet:', sourceFile.getText().substring(0, 100));
            console.log('ScriptKind:', sourceFile.getScriptKind());
        }
        // 1. Import declarations
        sourceFile.getImportDeclarations().forEach(decl => {
            const moduleSpecifier = decl.getModuleSpecifierValue();
            console.log(`Found import in ${sourceFile.getFilePath()}: ${moduleSpecifier}`);
            extractPackageName(moduleSpecifier, usedDeps);
        });

        // 2. Export declarations (re-exports)
        sourceFile.getExportDeclarations().forEach(decl => {
            const moduleSpecifier = decl.getModuleSpecifierValue();
            if (moduleSpecifier) {
                extractPackageName(moduleSpecifier, usedDeps);
            }
        });

        // 3. Dynamic imports and requires
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const callExpr of callExpressions) {
            const expression = callExpr.getExpression();
            const text = expression.getText();

            // import('...')
            if (callExpr.getKind() === SyntaxKind.CallExpression && callExpr.getExpression().getKind() === SyntaxKind.ImportKeyword) {
                const args = callExpr.getArguments();
                if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
                    extractPackageName(args[0].getText().replace(/['"]/g, ''), usedDeps);
                }
            }

            // require('...')
            if (text === 'require') {
                const args = callExpr.getArguments();
                if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
                    extractPackageName(args[0].getText().replace(/['"]/g, ''), usedDeps);
                }
            }
        }
    }

    // Filter out @types packages if the main package is used
    // Actually, we should just check if the dep is in usedDeps
    // We also need to handle @types/react -> react mapping if needed, 
    // but usually devDeps like @types/node are just imported as 'node' (or not imported explicitly).
    // For now, simple string matching.

    const unused = allDeps.filter(dep => {
        // specific check for @types
        if (dep.startsWith('@types/')) {
            const realName = dep.replace('@types/', '');
            if (usedDeps.has(realName)) return false;
        }
        return !usedDeps.has(dep);
    });

    return unused;
}

function extractPackageName(moduleSpecifier: string, usedDeps: Set<string>) {
    if (!moduleSpecifier) return;
    if (moduleSpecifier.startsWith('.')) return; // Local import
    if (moduleSpecifier.startsWith('/')) return; // Absolute import

    // Handle scoped packages @org/pkg
    if (moduleSpecifier.startsWith('@')) {
        const parts = moduleSpecifier.split('/');
        if (parts.length >= 2) {
            usedDeps.add(`${parts[0]}/${parts[1]}`);
        }
    } else {
        // Handle regular packages pkg/subpath
        const parts = moduleSpecifier.split('/');
        usedDeps.add(parts[0]);
    }
}
