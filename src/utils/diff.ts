import { createTwoFilesPatch } from "diff";
// import chalk from "chalk";

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
            return line;
        })
        .join("\n");
}
