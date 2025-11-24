import fs from "fs/promises";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCommand } from "../../src/cli/commands/init";

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn().mockResolvedValue({
      projectType: "Node.js",
      srcDir: "src",
      gitAware: true,
      dryRun: true,
      overwrite: false,
    }),
  },
}));

describe("init command", () => {
  const testDir = path.join(__dirname, "../fixtures/test-project");

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(__dirname);
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("should create purgecode.config.json with default settings", async () => {
    await initCommand();

    const configPath = path.join(testDir, "purgecode.config.json");
    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);

    expect(config).toHaveProperty("include");
    expect(config).toHaveProperty("exclude");
    expect(config).toHaveProperty("dryRun", true);
    expect(config).toHaveProperty("reportFormat", "markdown");
  });

  it("should not overwrite existing config", async () => {
    const configPath = path.join(testDir, "purgecode.config.json");
    const existingConfig = { custom: "config" };
    await fs.writeFile(configPath, JSON.stringify(existingConfig));

    await initCommand();

    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);

    expect(config).toEqual(existingConfig);
  });
});
