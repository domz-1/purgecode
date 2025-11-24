# CLI Commands

## `init`

Initialize `purgecode` configuration.

```bash
purgecode init
```

## `prune`

Analyze and clean the codebase.

```bash
purgecode prune [options]
```

### Options

- `-i, --interactive`: Run in interactive mode (select files to delete).
- `--git-aware`: Skip files with uncommitted changes.
- `--dry-run`: Don't make any changes (overrides config).
- `--no-dry-run`: Force apply changes.
- `--unused-imports`: Remove unused imports.
- `--unused-variables`: Remove unused variables.
- `--unused-files`: Remove unused files.
- `--remove-console`: Remove console logs.
- `--remove-comments`: Remove comments.
- `--format`: Format files with Prettier after changes.

## `validate`

Validate the configuration file.

```bash
purgecode validate
```
