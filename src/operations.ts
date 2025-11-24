import { SourceFile, SyntaxKind, VariableDeclaration } from 'ts-morph';
import prettier from 'prettier';

export function removeUnusedImports(sourceFile: SourceFile): number {
    try {
        const originalText = sourceFile.getFullText();
        sourceFile.organizeImports();
        const newText = sourceFile.getFullText();
        return originalText !== newText ? 1 : 0;
    } catch (error) {
        // console.warn(`Failed to organize imports in ${sourceFile.getFilePath()}:`, error);
        return 0;
    }
}

export function removeUnusedVariables(sourceFile: SourceFile): number {
    try {
        let count = 0;
        const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);

        for (const varDecl of variableDeclarations) {
            const name = varDecl.getName();
            const references = varDecl.findReferencesAsNodes();

            // If only 1 reference (the declaration itself), it's unused
            if (references.length === 1) {
                const statement = varDecl.getVariableStatement();
                if (statement) {
                    statement.remove();
                    count++;
                }
            }
        }

        return count;
    } catch (error) {
        return 0;
    }
}

export function removeConsole(sourceFile: SourceFile): number {
    try {
        let count = 0;
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

        for (const callExpr of callExpressions) {
            const expression = callExpr.getExpression();
            if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
                const propAccess = expression.asKind(SyntaxKind.PropertyAccessExpression);
                if (propAccess?.getExpression().getText() === 'console') {
                    callExpr.getParentIfKind(SyntaxKind.ExpressionStatement)?.remove();
                    count++;
                }
            }
        }
        return count;
    } catch (error) {
        return 0;
    }
}

export function removeComments(sourceFile: SourceFile): number {
    try {
        let count = 0;
        const comments = sourceFile.getDescendants().flatMap(node => [
            ...node.getLeadingCommentRanges(),
            ...node.getTrailingCommentRanges()
        ]);

        const uniqueComments = [...new Set(comments.map(c => c.getPos()))]
            .map(pos => {
                const c = comments.find(n => n.getPos() === pos)!;
                return { pos: c.getPos(), end: c.getEnd(), text: c.getText() };
            });

        uniqueComments.sort((a, b) => b.pos - a.pos);

        for (const comment of uniqueComments) {
            if (comment.text.includes('codeprune-ignore')) continue;
            sourceFile.replaceText([comment.pos, comment.end], '');
            count++;
        }

        return count;
    } catch (error) {
        return 0;
    }
}

export async function formatFile(sourceFile: SourceFile, prettierConfig?: any): Promise<void> {
    try {
        const text = sourceFile.getFullText();
        // Use provided config or resolve it (for single file usage)
        const options = prettierConfig ?? (await prettier.resolveConfig(sourceFile.getFilePath()) || {});
        const formatted = await prettier.format(text, {
            ...options,
            filepath: sourceFile.getFilePath(),
            parser: 'typescript' // Force parser if needed, or rely on filepath
        });
        sourceFile.replaceWithText(formatted);
    } catch (error) {
        // Ignore format errors
    }
}
