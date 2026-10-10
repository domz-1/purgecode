// Public API for purgecode
export { findUnusedFiles } from "./core/graph.js";
export { scanFiles } from "./core/analyzer.js";
export {
  removeUnusedImports,
  removeUnusedVariables,
  removeUnusedDeclarations,
  removeConsole,
  removeComments,
  formatFile,
  removeEmptyFilesAndFolders,
} from "./core/pruner.js";
export {
  checkUnusedDependencies,
  removeUnusedDependencies,
} from "./core/dependencies.js";
export { createBackup, restoreBackup } from "./utils/backup.js";
export { generateConfigFile, loadConfig, mergeConfig } from "./utils/config.js";
export { logger, spinner } from "./utils/index.js";
