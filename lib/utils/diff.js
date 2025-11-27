import { createTwoFilesPatch } from "diff";
// import chalk from "chalk";
export function generateDiff(fileName, oldContent, newContent) {
    const patch = createTwoFilesPatch(fileName, fileName, oldContent, newContent, "Original", "Modified");
    return patch
        .split("\n")
        .map((line) => {
        return line;
    })
        .join("\n");
}
