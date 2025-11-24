import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { findUnusedFiles } from "../../src/core/graph.js";
import path from "path";

describe("Advanced Graph Analysis", () => {
    it("should detect files used via dynamic imports", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        project.createSourceFile("src/entry.ts", `
      async function load() {
        await import('./dynamic');
      }
    `);
        project.createSourceFile("src/dynamic.ts", "export const d = 1;");
        project.createSourceFile("src/unused.ts", "export const u = 1;");

        const unused = findUnusedFiles(project, ["src/entry.ts"]);

        // Normalize paths for comparison
        const unusedRelative = unused.map(p => path.basename(p));

        expect(unusedRelative).toContain("unused.ts");
        expect(unusedRelative).not.toContain("dynamic.ts");
        expect(unusedRelative).not.toContain("entry.ts");
    });

    it("should detect files used via barrel exports", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        project.createSourceFile("src/entry.ts", `import { a } from './barrel';`);
        project.createSourceFile("src/barrel/index.ts", `export * from './a'; export * from './b';`);
        project.createSourceFile("src/barrel/a.ts", "export const a = 1;");
        project.createSourceFile("src/barrel/b.ts", "export const b = 1;");
        project.createSourceFile("src/unused.ts", "export const u = 1;");

        const unused = findUnusedFiles(project, ["src/entry.ts"]);
        const unusedRelative = unused.map(p => path.basename(p));

        expect(unusedRelative).toContain("unused.ts");
        expect(unusedRelative).not.toContain("index.ts");
        expect(unusedRelative).not.toContain("a.ts");
        expect(unusedRelative).not.toContain("b.ts");
    });

    it("should correctly identify unused clusters (isolated cycles)", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        project.createSourceFile("src/entry.ts", `import './used';`);
        project.createSourceFile("src/used.ts", "export const u = 1;");

        // Cycle
        project.createSourceFile("src/cycle-a.ts", `import './cycle-b';`);
        project.createSourceFile("src/cycle-b.ts", `import './cycle-a';`);

        const unused = findUnusedFiles(project, ["src/entry.ts"]);
        const unusedRelative = unused.map(p => path.basename(p));

        expect(unusedRelative).toContain("cycle-a.ts");
        expect(unusedRelative).toContain("cycle-b.ts");
        expect(unusedRelative).not.toContain("used.ts");
    });

    it("should handle require calls in JS/TS", () => {
        const project = new Project({ useInMemoryFileSystem: true });

        project.createSourceFile("src/entry.ts", `const req = require('./required');`);
        project.createSourceFile("src/required.ts", "module.exports = {};");
        project.createSourceFile("src/unused.ts", "export const u = 1;");

        const unused = findUnusedFiles(project, ["src/entry.ts"]);
        const unusedRelative = unused.map(p => path.basename(p));

        expect(unusedRelative).toContain("unused.ts");
        expect(unusedRelative).not.toContain("required.ts");
    });
});
