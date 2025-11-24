# 🚀 Complete Enhancement Guide for purgecode

A comprehensive compilation of all suggestions to transform your code-pruning library into a production-ready tool.

---

## 📋 Table of Contents

1. [Repository Structure](#repository-structure)
2. [Feature Enhancements](#feature-enhancements)
3. [Developer Experience](#developer-experience)
4. [Documentation & Community](#documentation--community)
5. [Packaging & Distribution](#packaging--distribution)
6. [Performance & Reliability](#performance--reliability)
7. [Advanced Graph Analysis](#advanced-graph-analysis)
8. [Implementation Checklist](#implementation-checklist)

---

## 1️⃣ Repository Structure

### Current Issues
- Only a `README.md` exists at root
- No package configuration file
- Source files are unorganized and flat
- Missing test directory
- No build/distribution setup
- Limited documentation

### Recommended Structure

```
purgecode/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated tests & checks
├── bin/
│   └── purgecode                  # CLI entry point
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── init.ts           # Config scaffolding
│   │   │   ├── prune.ts          # Main pruning logic
│   │   │   ├── list.ts           # List unused files
│   │   │   ├── watch.ts          # Watch mode
│   │   │   └── validate.ts       # Config validation
│   │   └── index.ts              # CLI entry
│   ├── core/
│   │   ├── analyzer.ts           # File dependency analysis
│   │   ├── graph.ts              # Dependency graph builder
│   │   ├── pruner.ts             # File deletion logic
│   │   └── reporter.ts           # Report generation
│   ├── utils/
│   │   ├── fs.ts                 # File system helpers
│   │   ├── git.ts                # Git integration
│   │   └── logger.ts             # Logging utilities
│   ├── types/
│   │   └── index.d.ts            # Type definitions
│   └── index.ts                  # Public API exports
├── tests/
│   ├── fixtures/                 # Sample projects
│   ├── unit/                     # Unit tests
│   └── integration/              # End-to-end tests
├── docs/
│   ├── getting-started.md
│   ├── configuration.md
│   ├── api-reference.md
│   ├── cli-commands.md
│   ├── plugins.md
│   └── faq.md
├── dist/                         # Build output (gitignored)
├── .codepruneignore             # Project-specific ignores
├── purgecode.config.json        # Default config
├── package.json
├── tsconfig.json
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## 2️⃣ Feature Enhancements

### Core Features

#### **`init` Command**
- Generates `purgecode.config.json` with sensible defaults
- Interactive prompts for project-specific settings
- Auto-detects project type (React, Node.js, Vue, etc.)
- Creates `.codepruneignore` file
- Suggests appropriate ignore patterns

```bash
purgecode init
```

**Config Schema:**
```json
{
  "include": ["src/**/*.ts", "src/**/*.js"],
  "exclude": ["src/generated/**", "node_modules/**", "dist/**"],
  "entryPoints": ["src/index.ts", "src/main.ts"],
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

#### **Plugin / Rule System**
Extensible architecture for custom pruning rules.

```typescript
// Example plugin
export const customRule: Rule = {
  name: 'unused-images',
  test: (file) => /\.(png|jpg|svg)$/.test(file),
  analyze: async (files, graph) => {
    // Custom logic to detect unused images
    return unusedImages;
  }
};

// Usage
purgecode.registerRule(customRule);
```

**Implementation:**
- Create `src/plugins/` folder
- Export `registerRule(rule: Rule)` API
- Load plugins from config: `"plugins": ["./my-plugin.js"]`

#### **Git-aware Mode**
Prevents deletion of tracked or staged files.

```bash
purgecode prune --git-aware
```

**Features:**
- Run `git status --porcelain` to check file status
- Skip files with `M` (modified) or `A` (added) flags
- Optionally skip all tracked files
- Respect `.gitignore` patterns

#### **Interactive Prompt Mode**
Safety net for manual confirmation before deletion.

```bash
purgecode prune --interactive
```

**Uses:**
- `inquirer` or `prompts` library
- Shows file list with checkboxes
- Allows selective deletion
- Confirms before proceeding

#### **Watch Mode**
Auto-prune on file changes (great for CI/dev workflows).

```bash
purgecode watch
```

**Implementation:**
- Use `chokidar` to watch `src/` directory
- Re-run analysis on change events
- Debounce rapid changes (500ms)
- Show real-time updates in terminal

#### **Multiple Report Formats**
Export analysis results in various formats.

```bash
purgecode prune --format json --output report.json
purgecode prune --format html --output report.html
purgecode prune --format markdown --output report.md
```

**Formats:**
- **JSON** – for automated tooling/CI
- **HTML** – interactive dashboard
- **Markdown** – human-readable reports
- **CSV** – for spreadsheet analysis

#### **Parallel Scanning**
Improve performance on large monorepos.

**Implementation:**
- Use `Promise.all()` with `worker_threads`
- Cap concurrency with `p-limit` (e.g., 4 workers)
- Divide files into chunks
- Aggregate results from workers

#### **Language-agnostic Scanners**
Expand beyond JavaScript/TypeScript.

**Supported Languages:**
- Python (`.py`)
- Go (`.go`)
- Rust (`.rs`)
- Java (`.java`)

**Implementation:**
- Abstract file-parsing layer
- Use `tree-sitter` for universal parsing
- Create parser adapters per language

#### **Config Validation**
Prevent broken configs from causing silent failures.

```bash
purgecode validate-config
```

**Uses:**
- JSON Schema validation with `ajv`
- Check file path validity
- Warn about conflicting patterns
- Suggest corrections

#### **Dry-run Diff View**
Visual preview of what will be removed.

```bash
purgecode prune --dry --diff
```

**Output:**
```diff
+ Files to Keep (235)
  src/index.ts
  src/utils/helper.ts
  
- Files to Remove (12)
  src/old-feature.ts
  src/unused-component.tsx
```

---

## 3️⃣ Developer Experience

### Improvements

| Feature | Benefit | Implementation |
|---------|---------|----------------|
| **Typed Public API** | Better IDE autocomplete, fewer runtime errors | Write comprehensive `.d.ts` files or use TypeScript throughout |
| **Unit Tests (80%+ coverage)** | Guarantees stability across changes | Use Jest/Vitest; test edge cases like circular imports |
| **Integration Tests** | Validates end-to-end CLI behavior | Create `tests/fixtures/` with sample projects |
| **Pre-commit Hooks** | Catches issues before they're committed | Use `husky` to run `npm run lint && purgecode list --dry` |
| **Semantic Release** | Automates versioning and changelog | Add `semantic-release` config + GitHub Action |
| **GitHub Action for CI** | Runs tests automatically on PRs | Create `.github/workflows/purgecode.yml` |
| **Auto-generated CLI Help** | Keeps docs synced with code | Use `commander`/`yargs` `.help()` method |
| **Error Codes & Docs** | Easier troubleshooting | Define `errors.ts` map (e.g., `E001: Config not found`) |

### Testing Strategy

```typescript
// Example unit test
describe('Analyzer', () => {
  it('detects unused files correctly', () => {
    const result = analyzeProject({
      include: ['tests/fixtures/sample/**/*.ts']
    });
    expect(result.unused).toContain('tests/fixtures/sample/dead-code.ts');
  });
  
  it('handles circular imports', () => {
    // Test circular dependency handling
  });
});
```

### Pre-commit Hook Setup

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "purgecode list --dry"
    ]
  }
}
```

---

## 4️⃣ Documentation & Community

### Essential Documentation

#### **README.md Template**

```markdown
# purgecode

> A lightweight CLI/library to prune unused code, dead paths, and stale configs from your project.

[![npm version](https://badge.fury.io/js/purgecode.svg)](https://www.npmjs.com/package/purgecode)
[![Build Status](https://github.com/user/purgecode/workflows/CI/badge.svg)](https://github.com/user/purgecode/actions)
[![codecov](https://codecov.io/gh/user/purgecode/branch/main/graph/badge.svg)](https://codecov.io/gh/user/purgecode)

## Why purgecode?

- ⚡ **Fast** – scans projects in < 1 second
- 🔒 **Safe** – dry-run mode by default
- 🧩 **Extensible** – plugin architecture for custom rules
- 🌐 **Language-agnostic** – supports JS, TS, Python, and more

## Quick Start

```bash
npx purgecode init
purgecode prune --dry
purgecode prune  # actually delete
```

[Full Documentation →](./docs/)
```

#### **docs/getting-started.md**
- Installation guide
- First-time setup
- Basic usage examples
- Common workflows

#### **docs/configuration.md**
- Complete config schema reference
- Advanced configuration examples
- Environment variables
- Config file locations

#### **docs/api-reference.md**
- Public API methods
- Type definitions
- Usage examples
- Best practices

#### **docs/cli-commands.md**
- Complete command reference
- All flags and options
- Examples for each command
- Exit codes

#### **docs/plugins.md**
- Plugin architecture overview
- Creating custom plugins
- Plugin API reference
- Example plugins

#### **docs/faq.md**
- Common questions
- Troubleshooting
- Performance tips
- Migration guides

### Community Files

#### **CONTRIBUTING.md**
```markdown
# Contributing to purgecode

## Development Setup
1. Fork and clone the repo
2. Run `npm install`
3. Run `npm test` to verify setup

## Code Style
- Use TypeScript
- Follow ESLint rules
- Write tests for new features
- Keep PRs focused

## Submitting PRs
1. Create a feature branch
2. Write/update tests
3. Update documentation
4. Submit PR with clear description
```

#### **CODE_OF_CONDUCT.md**
Use the standard [Contributor Covenant](https://www.contributor-covenant.org/).

#### **CHANGELOG.md**
Auto-generate with `standard-version` or `auto-changelog`.

#### **ROADMAP.md**
```markdown
## Planned
- [ ] Python support
- [ ] HTML report format
- [ ] VS Code extension

## In Progress
- [ ] Plugin system (v2.0)
- [ ] Watch mode

## Completed
- [x] Init command
- [x] Git-aware mode
```

### Additional Resources

- **Video Walkthrough** – 2-minute screencast on YouTube
- **Live Demo** – Hosted on GitHub Pages with embedded terminal
- **Blog Post** – "Introducing purgecode" on dev.to or Medium

---

## 5️⃣ Packaging & Distribution

### Distribution Channels

| Method | Command | Benefit |
|--------|---------|---------|
| **npm** | `npm i -g purgecode` | JavaScript ecosystem standard |
| **npx** | `npx purgecode prune` | Zero-install usage |
| **Docker** | `docker run purgecode/cli prune` | CI/CD integration |
| **Homebrew** | `brew install purgecode` | macOS convenience |
| **GitHub Releases** | Download binary | Manual installation |

### npm Setup

```json
// package.json
{
  "name": "purgecode",
  "version": "1.0.0",
  "bin": {
    "purgecode": "./dist/cli.js"
  },
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

### Docker Setup

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["--help"]
```

### Homebrew Formula

```ruby
class Purgecode < Formula
  desc "Prune unused code from your projects"
  homepage "https://github.com/user/purgecode"
  url "https://github.com/user/purgecode/archive/v1.0.0.tar.gz"
  sha256 "..."
  
  depends_on "node"
  
  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end
end
```

---

## 6️⃣ Performance & Reliability

### Optimizations

| Optimization | Impact | Implementation |
|--------------|--------|----------------|
| **Cache file stats** | Reduces repeated `fs.stat()` calls | Store `Map<filepath, mtime>` during run |
| **Incremental mode** | Only scans changed files | Persist `.purgecode-cache.json` with timestamps |
| **Graceful error handling** | Prevents single file from aborting scan | Wrap parsing in `try/catch`, log warnings |
| **Memory-efficient streaming** | Handles massive repos | Use `fs.createReadStream()` for large files |
| **Benchmark script** | Tracks performance regressions | Add `npm run bench` with timing output |

### Caching Example

```typescript
// src/utils/cache.ts
interface CacheEntry {
  mtime: number;
  analysis: AnalysisResult;
}

class Cache {
  private data: Map<string, CacheEntry> = new Map();
  
  async load() {
    if (fs.existsSync('.purgecode-cache.json')) {
      this.data = new Map(JSON.parse(
        await fs.readFile('.purgecode-cache.json', 'utf8')
      ));
    }
  }
  
  async save() {
    await fs.writeFile(
      '.purgecode-cache.json',
      JSON.stringify([...this.data])
    );
  }
  
  needsUpdate(file: string, mtime: number): boolean {
    const cached = this.data.get(file);
    return !cached || cached.mtime < mtime;
  }
}
```

---

## 7️⃣ Advanced Graph Analysis

### Enhanced Dependency Detection

#### **Dynamic Imports**
```typescript
// Detect both syntaxes
import('./module.js')
require('./module.js')
```

**Implementation:**
- Parse AST with `@babel/parser` or `acorn`
- Look for `ImportExpression` and `CallExpression` nodes
- Resolve dynamic paths (may require runtime info)

#### **Barrel Exports (Index Files)**
```typescript
// src/components/index.ts
export * from './Button';
export * from './Input';
export { default as Modal } from './Modal';
```

**Strategy:**
- Treat barrel files as "pass-through" nodes
- Mark re-exported files as used if barrel is used
- Handle default and named re-exports

#### **Config File References**
Check files referenced in:
- `package.json` (main, module, bin, types)
- `tsconfig.json` (include, exclude, files)
- Webpack, Vite, Rollup configs
- Test configs (jest.config.js, vitest.config.ts)

```typescript
// src/core/config-scanner.ts
async function scanPackageJson(pkgPath: string): Promise<string[]> {
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
  const referenced = [];
  
  if (pkg.main) referenced.push(pkg.main);
  if (pkg.module) referenced.push(pkg.module);
  if (pkg.types) referenced.push(pkg.types);
  if (pkg.bin) {
    referenced.push(...Object.values(pkg.bin));
  }
  
  return referenced.map(f => path.resolve(path.dirname(pkgPath), f));
}
```

#### **Entry Point Auto-detection**

```typescript
const defaultEntryPatterns = [
  'src/index.{ts,tsx,js,jsx}',
  'src/main.{ts,tsx,js,jsx}',
  'src/app.{ts,tsx,js,jsx}',
  'index.{ts,tsx,js,jsx}',
  'server.js',
  'app.js'
];

// From package.json
function detectEntryPoints(config: Config): string[] {
  const entries = new Set<string>();
  
  // User-specified
  config.entryPoints?.forEach(e => entries.add(e));
  
  // package.json
  const pkgEntries = scanPackageJson('./package.json');
  pkgEntries.forEach(e => entries.add(e));
  
  // Common patterns
  const matched = glob.sync(defaultEntryPatterns);
  matched.forEach(e => entries.add(e));
  
  return [...entries];
}
```

#### **Test File Handling**
```typescript
// Detect test files
const testPatterns = [
  '**/*.test.{ts,js}',
  '**/*.spec.{ts,js}',
  '**/__tests__/**'
];

// Mark files imported by tests as used
function analyzeTests(graph: DependencyGraph) {
  const testFiles = findTestFiles(testPatterns);
  
  testFiles.forEach(test => {
    const deps = graph.getDependencies(test);
    deps.forEach(dep => graph.markAsUsed(dep, 'test'));
  });
}
```

#### **Module System Support**

```typescript
// Handle mixed ESM/CommonJS
enum ModuleType {
  ESM = 'esm',
  CommonJS = 'commonjs',
  Mixed = 'mixed'
}

function detectModuleType(file: string): ModuleType {
  const ast = parseFile(file);
  
  const hasESM = ast.body.some(
    n => n.type === 'ImportDeclaration' || n.type === 'ExportDeclaration'
  );
  const hasCJS = ast.body.some(
    n => n.type === 'CallExpression' && 
         n.callee.name === 'require'
  );
  
  if (hasESM && hasCJS) return ModuleType.Mixed;
  if (hasESM) return ModuleType.ESM;
  return ModuleType.CommonJS;
}
```

---

## 8️⃣ Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Restructure folders (`src/cli/`, `src/core/`, `src/utils/`)
- [ ] Add `package.json` with proper bin entry
- [ ] Create `tsconfig.json` for TypeScript
- [ ] Set up basic test suite with Jest/Vitest
- [ ] Implement `init` command
- [ ] Write comprehensive README

### Phase 2: Core Features (Week 3-4)
- [ ] Enhanced graph analysis (dynamic imports, barrel exports)
- [ ] Entry point auto-detection
- [ ] Config validation with JSON Schema
- [ ] Git-aware mode
- [ ] Interactive prompt mode
- [ ] Multiple report formats (JSON, HTML, Markdown)

### Phase 3: Developer Experience (Week 5-6)
- [ ] Add unit tests (80%+ coverage)
- [ ] Create integration tests with fixtures
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add pre-commit hooks with Husky
- [ ] Implement semantic release
- [ ] Write TypeScript type definitions

### Phase 4: Advanced Features (Week 7-8)
- [ ] Plugin/rule system
- [ ] Watch mode with `chokidar`
- [ ] Parallel scanning with workers
- [ ] Caching and incremental mode
- [ ] Language-agnostic parsers
- [ ] Dry-run diff view

### Phase 5: Documentation (Week 9)
- [ ] Complete `docs/` folder structure
- [ ] Write getting-started guide
- [ ] Document API reference
- [ ] Create CLI command reference
- [ ] Write plugin development guide
- [ ] Add FAQ and troubleshooting

### Phase 6: Distribution (Week 10)
- [ ] Publish to npm
- [ ] Create Docker image
- [ ] Set up Homebrew formula
- [ ] Create GitHub releases
- [ ] Add badges to README
- [ ] Write announcement blog post

### Phase 7: Community (Ongoing)
- [ ] Add CONTRIBUTING.md
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Create ROADMAP.md
- [ ] Set up issue templates
- [ ] Create PR template
- [ ] Record video walkthrough

---

## 🎯 Priority Recommendations

### High-Value, Low-Effort (Start Here)
1. ✅ **Implement `init` command** – Quick win, huge UX improvement
2. ✅ **Restructure folders** – Clean foundation for future work
3. ✅ **Update README** – First thing users see
4. ✅ **Add basic tests** – Catch regressions early
5. ✅ **Publish to npm** – Make it accessible

### Medium Effort, High Impact
6. ✅ **Git-aware mode** – Prevents accidental deletions
7. ✅ **Interactive prompt** – Safety net for beginners
8. ✅ **Config validation** – Prevents user errors
9. ✅ **CI/CD setup** – Automates quality checks
10. ✅ **Multiple report formats** – Flexibility for different use cases

### Long-term Vision
11. 🚀 **Plugin system** – Extensibility for community
12. 🚀 **Watch mode** – Developer workflow integration
13. 🚀 **Language support** – Expand beyond JS/TS
14. 🚀 **Performance optimization** – Handle massive repos
15. 🚀 **VS Code extension** – IDE integration

---

## 📞 Need Help?

If you need assistance implementing any of these features:
- Code templates for specific commands
- Test suite setup
- CI/CD configuration
- API design advice

Just ask, and I'll provide ready-to-use code snippets!

---

**Last Updated:** 2025-01-24  
**Version:** 1.0  
**Maintainer:** purgecode team