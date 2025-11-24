export { scanFiles } from "./core/analyzer.js";
export {
  checkUnusedDependencies,
  removeUnusedDependencies,
} from "./core/dependencies.js";
export { findUnusedFiles } from "./core/graph.js";
export {
  formatFile,
  removeComments,
  removeConsole,
  removeEmptyFilesAndFolders,
  removeUnusedDeclarations,
  removeUnusedImports,
  removeUnusedVariables,
} from "./core/pruner.js";
export { createBackup, restoreBackup } from "./utils/backup.js";
export { generateConfigFile, loadConfig, mergeConfig } from "./utils/config.js";
export { logger, spinner } from "./utils/index.js";
