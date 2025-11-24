import { SyntaxKind } from "ts-morph";
import prettier from "prettier";
import fs from "fs/promises";
import path from "path";
export function removeUnusedImports(sourceFile) {
    try {
        const originalText = sourceFile.getFullText();
        sourceFile.organizeImports();
        const newText = sourceFile.getFullText();
        return originalText !== newText ? 1 : 0;
    }
    catch (error) {
        // console.warn(`Failed to organize imports in ${sourceFile.getFilePath()}:`, error);
        return 0;
    }
}
export function removeUnusedVariables(sourceFile) {
    try {
        let count = 0;
        const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
        for (const varDecl of variableDeclarations) {
            const name = varDecl.getName();
            // Find all identifiers with this name in the file
            const identifiers = sourceFile
                .getDescendantsOfKind(SyntaxKind.Identifier)
                .filter((id) => id.getText() === name);
            // If only 1 usage (the declaration itself), it's unused
            if (identifiers.length === 1) {
                const statement = varDecl.getVariableStatement();
                if (statement) {
                    statement.remove();
                    count++;
                }
            }
        }
        return count;
    }
    catch (error) {
        return 0;
    }
}
export function removeConsole(sourceFile) {
    try {
        let count = 0;
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const callExpr of callExpressions) {
            const expression = callExpr.getExpression();
            if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
                const propAccess = expression.asKind(SyntaxKind.PropertyAccessExpression);
                if (propAccess?.getExpression().getText() === "console") {
                    callExpr.getParentIfKind(SyntaxKind.ExpressionStatement)?.remove();
                    count++;
                }
            }
        }
        return count;
    }
    catch (error) {
        return 0;
    }
}
export function removeComments(sourceFile) {
    try {
        let count = 0;
        const comments = sourceFile
            .getDescendants()
            .flatMap((node) => [
            ...node.getLeadingCommentRanges(),
            ...node.getTrailingCommentRanges(),
        ]);
        const uniqueComments = [...new Set(comments.map((c) => c.getPos()))].map((pos) => {
            const c = comments.find((n) => n.getPos() === pos);
            return { pos: c.getPos(), end: c.getEnd(), text: c.getText() };
        });
        uniqueComments.sort((a, b) => b.pos - a.pos);
        for (const comment of uniqueComments) {
            if (comment.text.includes("codeprune-ignore"))
                continue;
            sourceFile.replaceText([comment.pos, comment.end], "");
            count++;
        }
        return count;
    }
    catch (error) {
        return 0;
    }
}
export async function formatFile(sourceFile, prettierConfig) {
    try {
        const text = sourceFile.getFullText();
        // Use provided config or resolve it (for single file usage)
        const options = prettierConfig ??
            ((await prettier.resolveConfig(sourceFile.getFilePath())) || {});
        const formatted = await prettier.format(text, {
            ...options,
            filepath: sourceFile.getFilePath(),
            parser: "typescript", // Force parser if needed, or rely on filepath
        });
        sourceFile.replaceWithText(formatted);
    }
    catch (error) {
        // Ignore format errors
    }
}
export function removeUnusedDeclarations(sourceFile) {
    try {
        let count = 0;
        const declarations = [
            ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
            ...sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration),
            ...sourceFile.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration),
            ...sourceFile.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration),
            ...sourceFile.getDescendantsOfKind(SyntaxKind.EnumDeclaration),
        ];
        for (const decl of declarations) {
            const name = decl.getName();
            if (!name)
                continue;
            // Find all identifiers with this name in the file
            const identifiers = sourceFile
                .getDescendantsOfKind(SyntaxKind.Identifier)
                .filter((id) => id.getText() === name);
            // If only 1 usage (the declaration itself), it's unused
            if (identifiers.length === 1) {
                decl.remove();
                count++;
            }
        }
        return count;
    }
    catch (error) {
        return 0;
    }
}
export async function removeEmptyFilesAndFolders(cwd, ignorePaths) {
    let filesRemoved = 0;
    let foldersRemoved = 0;
    // Function to check if directory is empty
    async function isEmptyDir(dirPath) {
        try {
            const entries = await fs.readdir(dirPath);
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory()) {
                    if (!(await isEmptyDir(fullPath)))
                        return false;
                }
                else if (stat.isFile()) {
                    const content = await fs.readFile(fullPath, "utf-8");
                    if (content.trim() !== "")
                        return false;
                }
            }
            return true;
        }
        catch {
            return false;
        }
    }
    // Function to remove empty items recursively
    async function removeEmpty(dirPath) {
        const entries = await fs.readdir(dirPath);
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                await removeEmpty(fullPath);
                // After processing subdirs, check if now empty
                if (await isEmptyDir(fullPath)) {
                    await fs.rmdir(fullPath);
                    foldersRemoved++;
                }
            }
            else if (stat.isFile()) {
                const content = await fs.readFile(fullPath, "utf-8");
                if (content.trim() === "") {
                    await fs.unlink(fullPath);
                    filesRemoved++;
                }
            }
        }
    }
    // Start from cwd, but skip ignorePaths
    await removeEmpty(cwd);
    return { filesRemoved, foldersRemoved };
}
