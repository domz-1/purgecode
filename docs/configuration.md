# Configuration

`purgecode` uses a `purgecode.config.json` file to store your project settings.

## Config Schema

```json
{
  "include": ["src/**/*.{ts,tsx,js,jsx}"],
  "exclude": ["node_modules/**", "dist/**"],
  "entryPoints": ["src/index.ts"],
  "dryRun": true,
  "reportFormat": "markdown",
  "git": {
    "respectGitignore": true,
    "skipTrackedFiles": false
  },
  "analysis": {
    "followDynamicImports": true,
    "checkBarrelExports": true,
    "scanConfigFiles": true
  }
}
```

## Options

### `include`
Array of glob patterns to include in the scan.
*Default:* `["src/**/*.{ts,tsx,js,jsx}"]`

### `exclude`
Array of glob patterns to exclude from the scan.
*Default:* `["node_modules/**", "dist/**", ...]`

### `entryPoints`
Array of file paths that are considered the "roots" of your application. All used code must be reachable from these files.
*Default:* Auto-detected from `package.json` or common patterns.

### `dryRun`
If `true`, no files will be modified or deleted by default.
*Default:* `true`

### `git`
Git integration settings.
- `respectGitignore`: Whether to ignore files listed in `.gitignore`.
- `skipTrackedFiles`: If `true`, skips files that have uncommitted changes (modified/staged).

### `analysis`
Advanced analysis settings.
- `followDynamicImports`: Whether to resolve `import()` expressions.
- `checkBarrelExports`: Whether to handle index files (barrel files) correctly.
