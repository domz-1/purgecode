export interface AnalysisResult {
    unusedFiles: string[];
    unusedImports: number;
    unusedVariables: number;
    unusedDeclarations: number;
    consoleRemoved: number;
    commentsRemoved: number;
    unusedDeps: string[];
    removedDeps: number;
    emptyFilesRemoved: number;
    emptyFoldersRemoved: number;
}

export function generateReport(
    result: AnalysisResult,
    format: "json" | "html" | "markdown",
): string {
    if (format === "json") {
        return JSON.stringify(result, null, 2);
    }

    if (format === "html") {
        return `
<!DOCTYPE html>
<html>
<head>
  <title>Purgecode Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #2563eb; }
    .stat { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: 500; }
    .value { font-family: monospace; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.25rem 0; color: #4b5563; }
  </style>
</head>
<body>
  <h1>Purgecode Analysis Report</h1>
  <div class="stat"><span class="label">Unused Imports Removed</span><span class="value">${result.unusedImports}</span></div>
  <div class="stat"><span class="label">Unused Variables Removed</span><span class="value">${result.unusedVariables}</span></div>
  <div class="stat"><span class="label">Unused Declarations Removed</span><span class="value">${result.unusedDeclarations}</span></div>
  <div class="stat"><span class="label">Console Logs Removed</span><span class="value">${result.consoleRemoved}</span></div>
  <div class="stat"><span class="label">Comments Removed</span><span class="value">${result.commentsRemoved}</span></div>
  <div class="stat"><span class="label">Unused Dependencies</span><span class="value">${result.unusedDeps.length}</span></div>
  <div class="stat"><span class="label">Removed Dependencies</span><span class="value">${result.removedDeps}</span></div>
  <div class="stat"><span class="label">Empty Files Removed</span><span class="value">${result.emptyFilesRemoved}</span></div>
  
  <h2>Unused Files (${result.unusedFiles.length})</h2>
  <ul>
    ${result.unusedFiles.map((f) => `<li>${f}</li>`).join("")}
  </ul>
</body>
</html>
    `.trim();
    }

    // Markdown
    return `
# Purgecode Analysis Report

| Metric | Value |
|--------|-------|
| Unused Imports Removed | ${result.unusedImports} |
| Unused Variables Removed | ${result.unusedVariables} |
| Unused Declarations Removed | ${result.unusedDeclarations} |
| Console Logs Removed | ${result.consoleRemoved} |
| Comments Removed | ${result.commentsRemoved} |
| Unused Dependencies | ${result.unusedDeps.length} |
| Removed Dependencies | ${result.removedDeps} |
| Empty Files Removed | ${result.emptyFilesRemoved} |

## Unused Files (${result.unusedFiles.length})

${result.unusedFiles.map((f) => `- ${f}`).join("\n")}
  `.trim();
}
