import fs from "fs/promises";
import path from "path";
import { logger } from "./index.js";

export interface Config {
  ignorePaths: string[];
  ignoreComments: string[];
  previewMode: boolean;
  fileExtensions: string[];
  removeComments: boolean;
  removeConsole: boolean;
  trimLines: boolean;
  removeUnusedFiles: boolean;
  removeUnusedImports: boolean;
  removeEmpty: boolean;
  formatWithPrettier: boolean;
  // New fields for enhanced config
  include?: string[];
  exclude?: string[];
  entryPoints?: string[];
  dryRun?: boolean;
  reportFormat?: string;
  git?: {
    respectGitignore?: boolean;
    skipTrackedFiles?: boolean;
  };
  analysis?: {
    followDynamicImports?: boolean;
    checkBarrelExports?: boolean;
    scanConfigFiles?: boolean;
  };
}

export const defaultConfig: Config = {
  ignorePaths: ["node_modules", "dist", "build", ".git"],
  ignoreComments: ["codeprune-ignore"],
  previewMode: false, // Default to making changes, user can enable preview with --preview
  fileExtensions: ["js", "ts", "jsx", "tsx"],
  removeComments: false,
  removeConsole: false,
  trimLines: true,
  removeUnusedFiles: false,
  removeUnusedImports: true,
  removeEmpty: false,
  formatWithPrettier: true,
};

export async function loadConfig(cwd: string): Promise<Config> {
  const configPath = path.join(cwd, "purgecode.config.json");
  try {
    const content = await fs.readFile(configPath, "utf-8");
    const userConfig = JSON.parse(content);
    return { ...defaultConfig, ...userConfig };
  } catch (error) {
    // If file doesn't exist, return default
    return defaultConfig;
  }
}

export function mergeConfig(config: Config, options: any): Config {
  return {
    ...config,
    removeUnusedImports:
      options.unusedImports !== undefined
        ? options.unusedImports
        : config.removeUnusedImports,
    removeUnusedFiles:
      options.unusedFiles !== undefined
        ? options.unusedFiles
        : config.removeUnusedFiles,
    removeEmpty:
      options.removeEmpty !== undefined
        ? options.removeEmpty
        : config.removeEmpty,
    removeConsole:
      options.removeConsole !== undefined
        ? options.removeConsole
        : config.removeConsole,
    formatWithPrettier:
      options.format !== undefined ? options.format : config.formatWithPrettier,
    trimLines:
      options.trimLines !== undefined ? options.trimLines : config.trimLines,
    // Enable preview mode if --preview flag is passed, otherwise use config default
    previewMode:
      options.preview === true
        ? true
        : options.preview === false
          ? false
          : config.previewMode,
  };
}

export async function generateConfigFile(cwd: string): Promise<void> {
  const configPath = path.join(cwd, "purgecode.config.json");

  try {
    // Check if config already exists
    await fs.access(configPath);
    // Config exists, don't overwrite
    return;
  } catch {
    // Config doesn't exist, create it
    const configContent = JSON.stringify(defaultConfig, null, 2);
    await fs.writeFile(configPath, configContent, "utf-8");
    logger.success(`Created config file at purgecode.config.json`);
  }
}
