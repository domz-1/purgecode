# purgecode

> A safe, smart, and interactive code-cleaning utility for JavaScript/TypeScript projects.

[![npm version](https://badge.fury.io/js/purgecode.svg)](https://www.npmjs.com/package/purgecode)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**purgecode** helps you maintain a clean and healthy codebase by automatically detecting and removing unused code, files, and dependencies. It's built with safety in mind, offering interactive modes, dry runs, and git awareness to prevent accidental data loss.

## Why purgecode?

- ⚡ **Fast Analysis**: Scans your entire project in seconds using `ts-morph` and `glob`.
- 🔒 **Safety First**: Defaults to **dry-run** mode. Never deletes anything without your explicit permission.
- 🛡️ **Git Aware**: Automatically skips files that are modified or staged in git to prevent conflicts.
- 🧠 **Smart Detection**: Identifies unused imports, variables, functions, classes, files, and even `package.json` dependencies.
- 🎮 **Interactive Mode**: A user-friendly CLI interface lets you review and select exactly what to prune.
- ⚙️ **Highly Configurable**: Customize behavior via `purgecode.config.json`.

## Installation

You can run `purgecode` directly using `npx` (recommended) or install it globally.

```bash
# Run with npx (no installation required)
npx purgecode --help

# Install globally
npm install -g purgecode
```

## Quick Start

1.  **Initialize Configuration** (Optional but recommended)
    Create a `purgecode.config.json` file with default settings.

    ```bash
    npx purgecode init
    ```

2.  **Run a Dry Run**
    Analyze your project and see what *would* be removed. This is the default behavior.

    ```bash
    npx purgecode prune
    ```

3.  **Interactive Mode**
    The safest way to clean your code. Review each item before deletion.

    ```bash
    npx purgecode prune --interactive
    ```

4.  **Apply Changes**
    Once you are confident, run with `--no-dry-run` to actually delete files and code.

    ```bash
    npx purgecode prune --no-dry-run
    ```

## Commands

### `init`
Initializes a new `purgecode.config.json` file in the current directory.

```bash
npx purgecode init
```

### `prune`
The main command to analyze and clean your codebase.

**Options:**
- `-i, --interactive`: Run in interactive mode (recommended).
- `--preview`: Run in preview mode (no changes).
- `--no-dry-run`: Execute the changes (delete files/code).
- `--unused-imports`: Remove unused imports.
- `--unused-variables`: Remove unused variables.
- `--unused-declarations`: Remove unused functions, classes, interfaces, enums.
- `--unused-files`: Remove unused files.
- `--unused-dependencies`: Check for unused dependencies in `package.json`.
- `--remove-unused-dependencies`: Remove unused dependencies from `package.json`.
- `--remove-console`: Remove `console.log` and other console calls.
- `--remove-comments`: Remove comments (except those marked with `codeprune-ignore`).
- `--remove-empty`: Remove empty files and directories.
- `--format`: Format modified files with Prettier.
- `--restore`: Restore from a backup.
- `--no-backup`: Disable automatic backup before pruning.
- `--git-aware`: Skip files with uncommitted changes (default: true in config).
- `--diff`: Show diff of changes in preview mode.
- `--output <file>`: Save the report to a file.
- `--report-format <format>`: Format of the report (`json`, `html`, `markdown`).

### `list`
List unused files without deleting them. Useful for quick checks.

```bash
npx purgecode list
npx purgecode list --json
```

### `watch`
Watch for file changes and re-run analysis automatically.

```bash
npx purgecode watch
```

### `validate`
Validate your `purgecode.config.json` configuration file.

```bash
npx purgecode validate
```

## Configuration

You can configure `purgecode` by creating a `purgecode.config.json` file in your project root.

```json
{
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "fileExtensions": ["ts", "tsx", "js", "jsx"],
  "entryPoints": ["src/index.ts", "src/main.tsx"],
  "dryRun": true,
  "git": {
    "respectGitignore": true,
    "skipTrackedFiles": true
  },
  "features": {
    "unusedFiles": true,
    "unusedImports": true,
    "unusedVariables": true,
    "unusedDependencies": false,
    "console": false,
    "comments": false
  }
}
```

### Configuration Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `include` | `string[]` | Glob patterns for files to include in the analysis. |
| `exclude` | `string[]` | Glob patterns for files to exclude. |
| `entryPoints` | `string[]` | Entry points of your application (used to determine unused files). |
| `dryRun` | `boolean` | If `true`, no changes will be written to disk. |
| `git.respectGitignore` | `boolean` | If `true`, ignores files listed in `.gitignore`. |
| `git.skipTrackedFiles` | `boolean` | If `true`, skips files that have uncommitted changes. |
| `features` | `object` | Toggle specific pruning features on/off by default. |

## Pruning Capabilities

### Unused Code
Removes unused:
- **Imports**: Cleans up import statements.
- **Variables**: Removes variables that are declared but never used.
- **Declarations**: Removes functions, classes, interfaces, types, and enums that are not exported and not used within the file.

### Unused Files
Detects files that are not imported by any other file in your project, starting from the `entryPoints` defined in your config.

### Unused Dependencies
Analyzes your `package.json` and source code to find dependencies that are listed but never imported.

### Code Cleanup
- **Console Removal**: Removes `console.log`, `console.error`, etc.
- **Comment Removal**: Removes comments to clean up code density.
- **Empty Files**: Deletes files and directories that are empty.

## Safety & Backups

### Git Awareness
By default, `purgecode` checks your git status. If a file has uncommitted changes, it will be skipped to prevent potential merge conflicts or data loss.

### Automatic Backups
Before applying any destructive changes (when `--no-dry-run` is used), `purgecode` creates a backup of the modified files. You can restore these backups using the `--restore` flag.

## Ignoring Code

To prevent specific lines or blocks from being processed, you can use the `codeprune-ignore` comment.

```typescript
// codeprune-ignore
const importantButUnused = "don't delete me";
```

## License

ISC
