# CodePrune Test Data Summary

This test project now contains comprehensive dirty data to test all CodePrune features.

## 📁 Test Files Created

### 1. **unused-imports.ts**
Tests: Unused import removal
- Contains 4 unused imports from 'react'
- Unused imports from 'fs', 'path', 'lodash'
- Unused imports from non-existent module
- Only `useState` is actually used

### 2. **unused-variables.ts**
Tests: Unused variable removal
- Unused constants, let, and var declarations
- Unused objects and arrays
- Unused arrow functions
- Only `usedVariable` export is actually used

### 3. **console-logs.ts**
Tests: Console log removal
- console.log statements
- console.warn statements
- console.error statements
- console.info, console.debug, console.table, console.trace
- Console logs in functions

### 4. **comments.ts**
Tests: Comment removal
- Single-line comments (//)
- Multi-line comments (/* */)
- JSDoc comments (/** */)
- TODO, FIXME, NOTE comments
- Inline and end-of-line comments
- Commented-out code

### 5. **unused-declarations.ts**
Tests: Unused declaration removal
- Unused functions
- Unused classes
- Unused interfaces
- Unused type aliases
- Unused enums
- Unused arrow functions
- Unused async functions
- Has some used exports that should stay

### 6. **mixed-issues.ts**
Tests: Multiple features at once
- Unused imports
- Unused variables
- Console logs
- Comments (single and multi-line)
- Unused functions
- Mix of all issues in one file

### 7. **completely-unused.ts**
Tests: Unused file detection
- Entire file is never imported anywhere
- Should be detected as unused file

### 8. **another-unused.ts**
Tests: Unused file detection
- Another file that's never imported
- Should be detected as unused file

### 9. **empty-file.ts**
Tests: Empty file removal
- Completely empty file
- Should be removed

### 10. **whitespace-only.ts**
Tests: Empty file removal
- File with only whitespace/newlines
- Should be detected as empty and removed

### 11. **ignore-me.ts**
Tests: Ignore functionality
- Has `// codeprune-ignore` comment at top
- Contains many issues that should NOT be cleaned
- Tests that ignore directive works

### 12. **formatting-needed.ts**
Tests: Prettier formatting
- Poorly formatted code
- Missing spaces, bad indentation
- Long lines that need wrapping
- Tests Prettier integration

## 📂 Empty Directories Created

Tests: Empty folder removal
- `src/empty-folder/` - completely empty
- `src/nested/deep/empty/` - nested empty folders
- `src/components/unused/` - unused component folder

## 📦 Package.json Updates

Tests: Unused dependency detection
Added unused dependencies:
- lodash (not used in code)
- axios (not used in code)
- moment (not used in code)
- express (not used in code)
- react (imported but could be unused after cleanup)
- vue (not used in code)

## ⚙️ Config File

Created `codeprune.config.json` to test:
- Configuration file loading
- Custom ignore paths
- Feature toggles

## 🎯 What Each Feature Should Detect

### Remove Unused Imports
- Should remove ~15+ unused imports across files
- Should keep only actually used imports

### Remove Unused Variables
- Should remove ~10+ unused variables
- Should keep exported/used variables

### Remove Unused Declarations
- Should remove ~8+ unused functions/classes/interfaces/types/enums
- Should keep used exports

### Remove Console Logs
- Should remove ~15+ console statements
- All console.* variants

### Remove Comments
- Should remove ~30+ comments
- Single-line, multi-line, JSDoc, TODO, FIXME, etc.

### Remove Unused Files
- Should detect 2 completely unused files
- Should offer to delete them

### Remove Empty Files/Folders
- Should remove 2 empty files
- Should remove 3+ empty directories

### Check Unused Dependencies
- Should detect 6 unused dependencies in package.json
- Should offer to remove them

### Format with Prettier
- Should format all files consistently
- Fix indentation, spacing, line length

### Ignore Functionality
- Should skip `ignore-me.ts` completely
- Should respect `// codeprune-ignore` directive

## 🧪 How to Test

Run CodePrune with all features enabled:

```bash
cd test-project
node ../bin/cli.js
```

Select all cleanup tasks and run without preview mode to see all changes applied.

## ✅ Expected Results

After running CodePrune with all features:
- Cleaner, more maintainable code
- No unused imports, variables, or declarations
- No console logs or comments
- No empty files or folders
- Properly formatted code
- Unused dependencies identified
- Files with ignore directive untouched
