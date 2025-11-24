Here is an expanded, polished **full project prompt** including ALL your requested new features:

---

# ✅ **Full Project Prompt (Updated + Expanded)**

**Project Name:** `codeprune` (or any user-chosen name)
**Type:** NPM Package + CLI Tool
**Goal:** A safe, smart code-cleaning utility for JavaScript/TypeScript projects.

---

# 🎯 **Primary Purpose**

Create a CLI tool that analyzes a JS/TS project and automatically removes unused imports, unused files, stray comments, console logs, and more — with every feature **toggleable via command-line options** or config.

---

# 🚀 **Core Features (Updated)**

## **1. Remove unused imports inside each file**

* Parse `.js`, `.jsx`, `.ts`, `.tsx`.
* Detect variables, functions, or modules imported but never referenced.
* Rewrite import statements to keep only used items.
* Remove entire import lines if everything is unused.
* Support both **ESM** and **CommonJS** (`require`).

---

## **2. Remove files that are never used**

* Build a project-wide reference/dependency graph.
* Detect files whose exports are never imported.
* Mark completely unused files.
* Users can:

  * **Preview first**, then confirm deletion.
  * Auto-delete.
  * Skip deletion using CLI flag.

---

## **3. CLI Application (`npx codeprune`)**

When a user runs:

```
npx codeprune
```

CLI prompts (Inquirer or similar):

### **Project scan options**

* Choose:

  * Project root
  * Additional path(s) to scan
  * File extensions to include (`js`, `ts`, `jsx`, `tsx`)
* Choose which cleanup modules to enable:

### **Feature toggles (all optional)**

Users can enable/disable:

| Feature                                      | CLI Flag Example    | Description                         |
| -------------------------------------------- | ------------------- | ----------------------------------- |
| Remove unused imports                        | `--unused-imports`  | Default ON                          |
| Remove unused files                          | `--unused-files`    | Deletes or previews unused modules  |
| Remove JS/JSX comments                       | `--remove-comments` | Strips single & multi-line comments |
| Remove `console.log` and other console calls | `--remove-console`  | Removes console.* across code       |
| Run Prettier formatting                      | `--format`          | Formats code after cleanup          |
| Remove extra blank lines                     | `--trim-lines`      | Removes repeated newlines           |
| Preview mode                                 | `--preview`         | Show diff without modifying files   |

---

## **4. Ignore Options**

Users can ignore specific paths or files.

### CLI flags:

```
--ignore-path node_modules
--ignore-path build
--ignore-path dist
```

### File-level ignore comment:

At the top of a file:

```js
// codeprune-ignore
```

→ Tool skips entire file.

---

## **5. Configuration File Support**

Support:

`codeprune.config.json`

Example:

```json
{
  "ignorePaths": ["node_modules", "dist"],
  "ignoreComments": ["codeprune-ignore"],
  "previewMode": true,
  "fileExtensions": ["js", "ts", "jsx", "tsx"],
  "removeComments": true,
  "removeConsole": false,
  "trimLines": true,
  "removeUnusedFiles": true,
  "removeUnusedImports": true,
  "formatWithPrettier": true
}
```

---

## **6. Output**

Terminal output example:

```
✓ 12 unused imports removed
✓ 3 unused files deleted
✓ 42 console logs removed
✓ 88 comments stripped
✓ Formatting applied
✓ Completed in 1.2s
```

---

# ⚙️ **Technical Requirements**

### Parsing

* Use **Babel parser**, **Recast**, or **TypeScript Compiler API**.
* Track symbol usage per file.
* Use AST to detect:

  * unused imports
  * unused exports
  * console.* calls
  * comments
  * blank lines

### Dependency Graph

* Follow imports/exports.
* Detect unused files.

### Code rewriting

* Use **Prettier** for formatting.
* Safely update import/export statements.

### Safety

* Always provide a **preview mode**.
* Skip files with ignore comments.

---

# 🧩 **Additional Optional Features (optional implementation)**

* Dry-run flag: `--dry-run`
* JSON output summary: `--json`
* Watch mode: `--watch`

---

# 🎁 Final Prompt Summary (for developer use)

**Create an NPM package + CLI tool called `codeprune` that:**

* Removes unused imports
* Removes unused files
* Removes JS/JSX comments
* Removes console logs
* Trims extra blank lines
* Formats using Prettier
* Everything toggleable via flags & config
* Supports ignore rules & ignore comments
* Uses AST parsing + dependency graph
* Provides preview mode, interactivity, and a clear final summary

---

If you want, I can also provide:

✅ Directory structure
✅ Boilerplate code for CLI
✅ AST logic for import-cleaning
✅ File graph builder
✅ Prettier integration
✅ Full implementation plan

Just tell me **"Generate the code"** or **"Generate the project structure"**!
