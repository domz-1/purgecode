import path from "path";
import { Project } from "ts-morph";

export function findUnusedFiles(
  project: Project,
  entryPoints: string[] = [],
): string[] {
  const sourceFiles = project.getSourceFiles();
  const allFilePaths = new Set(sourceFiles.map((sf) => sf.getFilePath()));
  const importedFiles = new Set<string>();

  for (const sourceFile of sourceFiles) {
    // Get all imports
    const imports = sourceFile.getImportDeclarations();
    const exports = sourceFile.getExportDeclarations(); // Re-exports

    for (const decl of [...imports, ...exports]) {
      const moduleSpecifier = decl.getModuleSpecifier();
      if (moduleSpecifier) {
        const sourceFileDef = decl.getModuleSpecifierSourceFile();
        if (sourceFileDef) {
          importedFiles.add(sourceFileDef.getFilePath());
        }
      }
    }
  }

  // Filter out files that are imported
  let unusedFiles = [...allFilePaths].filter(
    (filePath) => !importedFiles.has(filePath),
  );

  // Filter out known entry points or common entry patterns
  const entryPatterns = ["index", "main", "app", "entry"];
  unusedFiles = unusedFiles.filter((filePath) => {
    const baseName = path.basename(filePath, path.extname(filePath));
    return !entryPatterns.includes(baseName.toLowerCase());
  });

  return unusedFiles;
}
