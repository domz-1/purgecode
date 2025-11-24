import fs from "fs/promises";
import inquirer from "inquirer";
import path from "path";
import { logger, spinner } from "./utils.js";

const BACKUP_DIR_NAME = ".codeprune-backup";

export async function createBackup(
  cwd: string,
  files: string[],
): Promise<string | null> {
  if (files.length === 0) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(cwd, BACKUP_DIR_NAME, timestamp);

  try {
    await fs.mkdir(backupPath, { recursive: true });

    for (const file of files) {
      const relativePath = path.relative(cwd, file);
      const destPath = path.join(backupPath, relativePath);

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(file, destPath);
    }

    return backupPath;
  } catch (error) {
    logger.error(`Failed to create backup: ${error}`);
    return null;
  }
}

export async function listBackups(cwd: string): Promise<string[]> {
  const backupRootDir = path.join(cwd, BACKUP_DIR_NAME);
  try {
    const entries = await fs.readdir(backupRootDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .reverse(); // Newest first
  } catch (error) {
    return [];
  }
}

export async function restoreBackup(cwd: string): Promise<void> {
  const backups = await listBackups(cwd);

  if (backups.length === 0) {
    logger.warn("No backups found.");
    return;
  }

  const { selectedBackup } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedBackup",
      message: "Select a backup to restore:",
      choices: backups,
    },
  ]);

  const backupPath = path.join(cwd, BACKUP_DIR_NAME, selectedBackup);

  spinner.start("Restoring files...");
  try {
    // We need to recursively copy everything from backupPath back to cwd
    await copyRecursive(backupPath, cwd);
    spinner.succeed(`Restored backup from ${selectedBackup}`);
  } catch (error) {
    spinner.fail(`Failed to restore backup: ${error}`);
  }
}

async function copyRecursive(src: string, dest: string) {
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
