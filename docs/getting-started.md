# Getting Started with purgecode

## Installation

You can use `purgecode` directly with `npx` (recommended) or install it globally.

### Using npx (Zero Install)

```bash
npx purgecode <command>
```

### Global Install

```bash
npm install -g purgecode
# or
yarn global add purgecode
```

## First-Time Setup

1.  Navigate to your project root.
2.  Run the initialization command:

    ```bash
    npx purgecode init
    ```

3.  Follow the interactive prompts to configure your project type and preferences.
4.  This will create:
    -   `purgecode.config.json`: Your configuration file.
    -   `.codepruneignore`: A file to list paths to ignore (like `.gitignore`).

## Basic Usage

### Dry Run (Safe Mode)

By default, `purgecode` runs in dry-run mode (unless configured otherwise). This means it will only list what *would* be deleted or changed, without modifying any files.

```bash
npx purgecode prune
```

### Interactive Pruning

To selectively delete files, use the interactive mode:

```bash
npx purgecode prune --interactive
```

You will be presented with a list of unused files and can choose which ones to delete.

### Git-Aware Mode

If you enabled Git-aware mode during init (or use the `--git-aware` flag), `purgecode` will automatically skip any files that have uncommitted changes. This ensures you don't lose work-in-progress code.

```bash
npx purgecode prune --git-aware
```
