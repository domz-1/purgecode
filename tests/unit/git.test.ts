import { exec } from "child_process";
import { describe, expect, it, vi } from "vitest";
import { getDirtyFiles, isGitRepo } from "../../src/utils/git";

vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

describe("Git Utils", () => {
  it("should detect git repo", async () => {
    (exec as any).mockImplementation((cmd, opts, cb) => {
      if (typeof opts === "function") cb = opts;
      cb(null, { stdout: "true", stderr: "" });
    });

    const result = await isGitRepo("/tmp");
    expect(result).toBe(true);
  });

  it("should return false if not git repo", async () => {
    (exec as any).mockImplementation((cmd, opts, cb) => {
      if (typeof opts === "function") cb = opts;
      cb(new Error("Not a git repo"), { stdout: "", stderr: "" });
    });

    const result = await isGitRepo("/tmp");
    expect(result).toBe(false);
  });

  it("should get dirty files", async () => {
    (exec as any).mockImplementation((cmd, opts, cb) => {
      if (typeof opts === "function") cb = opts;
      cb(null, { stdout: " M src/index.ts\n A src/new.ts\n", stderr: "" });
    });

    const files = await getDirtyFiles("/tmp");
    expect(files).toHaveLength(2);
    expect(files[0]).toContain("src/index.ts");
    expect(files[1]).toContain("src/new.ts");
  });
});
