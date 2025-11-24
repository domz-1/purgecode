import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);

export async function isGitRepo(cwd: string): Promise<boolean> {
    try {
        await execAsync("git rev-parse --is-inside-work-tree", { cwd });
        return true;
    } catch {
        return false;
    }
}

export async function getDirtyFiles(cwd: string): Promise<string[]> {
    try {
        const { stdout } = await execAsync("git status --porcelain", { cwd });
        return stdout
            .split("\n")
            .filter((line) => line.trim() !== "")
            .map((line) => {
                // porcelain format: XY PATH
                // We care about the path, which starts at index 3
                return path.resolve(cwd, line.substring(3).trim());
            });
    } catch {
        return [];
    }
}

export async function isIgnored(cwd: string, filePath: string): Promise<boolean> {
    try {
        await execAsync(`git check-ignore "${filePath}"`, { cwd });
        return true;
    } catch {
        return false;
    }
}
