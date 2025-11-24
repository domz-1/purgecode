import { createTwoFilesPatch } from "diff";
import chalk from "chalk";

export function generateDiff(
    fileName: string,
    oldContent: string,
    newContent: string,
): string {
    const patch = createTwoFilesPatch(
        fileName,
        fileName,
        oldContent,
        newContent,
        "Original",
        "Modified",
    );

    return patch
        .split("\n")
        .map((line) => {
            if (line.startsWith("---") || line.startsWith("+++")) return chalk.bold(line);
            if (line.startsWith("@@")) return chalk.cyan(line);
            if (line.startsWith("+")) return chalk.green(line);
            if (line.startsWith("-")) return chalk.red(line);
            return line;
        })
        .join("\n");
}
