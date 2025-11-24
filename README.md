# purgecode

> A safe, smart code-cleaning utility for JavaScript/TypeScript projects.

[![npm version](https://badge.fury.io/js/purgecode.svg)](https://www.npmjs.com/package/purgecode)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Why purgecode?

- ⚡ **Fast** – scans projects in seconds
- 🔒 **Safe** – dry-run mode by default, git-aware protection
- 🧩 **Extensible** – configurable rules and ignore patterns
- 🌐 **Smart** – detects unused imports, variables, files, and dependencies

## Quick Start

```bash
# Initialize configuration
npx purgecode init

# Run a dry-run prune (default)
npx purgecode prune

# Run interactively (recommended)
npx purgecode prune --interactive

# Actually delete files (use with caution!)
npx purgecode prune --no-dry-run
```

## Features

- **Interactive Mode**: Select exactly what you want to delete.
- **Git-Aware**: Automatically skips modified or staged files to prevent accidents.
- **Configurable**: `purgecode.config.json` lets you fine-tune behavior.
- **Dependency Check**: Finds unused packages in `package.json`.
- **AST Transformation**: Removes unused imports, variables, and console logs safely.

## Configuration

Run `purgecode init` to generate a `purgecode.config.json` file.

```json
{
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": ["node_modules/**", "dist/**"],
  "entryPoints": ["src/index.ts"],
  "dryRun": true,
  "git": {
    "respectGitignore": true,
    "skipTrackedFiles": true
  }
}
```

## Commands

- `init`: Initialize configuration.
- `prune`: Analyze and clean code.
- `validate`: Validate configuration file.

## Documentation

See [docs/](./docs/) for more detailed documentation.
