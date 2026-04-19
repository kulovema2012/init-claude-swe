# CLI Scaffold Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade init-claude-swe from a single CLAUDE.md installer to a full `.claude/` scaffold generator with multi-level interactive onboarding, base+override template composition, and a `@clack/prompts` UI.

**Architecture:** A navigation tree (`src/navigation.js`) defines all categories/types/stacks with slugs. Prompts walk the tree level-by-level. `src/utils/resolve.js` converts slug arrays to GitHub raw URLs. `src/utils/fetch.js` downloads MANIFEST.json files and all template files in parallel. `src/utils/scaffold.js` merges base+leaf manifests and writes files atomically to disk.

**Tech Stack:** Node.js ≥18, CommonJS, Bun (test runner), `@clack/prompts`, `commander`, GitHub raw content API

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `src/navigation.js` | CREATE | TREE constant + BASE_URL |
| `src/utils/resolve.js` | CREATE | slug arrays → GitHub raw URLs |
| `src/utils/scaffold.js` | CREATE | manifest merge + atomic disk write |
| `src/utils/fetch.js` | MODIFY | add `fetchManifest` + `fetchFiles` |
| `src/utils/prompt.js` | REPLACE | clack multi-level select |
| `src/utils/gitignore.js` | UNCHANGED | — |
| `src/commands/install.js` | REWRITE | full pipeline orchestration |
| `src/cli.js` | MODIFY | clack intro/outro, new flags |
| `src/templates.js` | DELETE | replaced by navigation + resolve |
| `test/navigation.test.js` | CREATE | tree shape + slug uniqueness |
| `test/resolve.test.js` | CREATE | URL generation |
| `test/scaffold.test.js` | CREATE | merge logic + disk write |
| `test/fetch.test.js` | MODIFY | manifest + parallel fetch |
| `test/prompt.test.js` | MODIFY | simulate-based tests for new API |
| `test/install.test.js` | MODIFY | full pipeline with mock server |
| `test/cli.test.js` | MODIFY | new flags |
| `templates/_base/MANIFEST.json` | CREATE | base file list |
| `templates/_base/.claude/settings.json` | CREATE | default plugin config |
| `templates/_base/.claude/rules/*.md` | CREATE | 8 shared rule files |
| `templates/<stack>/MANIFEST.json` | CREATE | per-stack manifest (25 stacks) |
| `templates/<stack>/CLAUDE.md` | CREATE | per-stack role prompt (25 stacks) |
| `templates/<stack>/.claude/rules/environment-isolation.md` | CREATE | per-stack env rules (25 stacks) |

---

## Task 1: Add @clack/prompts and create src/navigation.js

**Files:**
- Create: `src/navigation.js`
- Create: `test/navigation.test.js`
- Modify: `package.json`

- [ ] **Step 1: Install @clack/prompts**

```bash
cd C:\Users\new_k\development-labs\ai-ml-development\init-claude-swe
bun add @clack/prompts
```

Expected: `@clack/prompts` appears in `package.json` dependencies.

- [ ] **Step 2: Write the failing test**

Create `test/navigation.test.js`:

```javascript
'use strict';

const { test, expect, describe } = require('bun:test');
const { TREE, BASE_URL } = require('../src/navigation');

describe('TREE', () => {
  test('has 7 top-level categories', () => {
    // Arrange / Act / Assert
    expect(TREE).toHaveLength(7);
  });

  test('every node has label and slug', () => {
    function walk(nodes) {
      for (const node of nodes) {
        expect(typeof node.label).toBe('string');
        expect(typeof node.slug).toBe('string');
        expect(node.slug).toMatch(/^[a-z0-9-]+$/);
        if (node.children) walk(node.children);
      }
    }
    walk(TREE);
  });

  test('all slugs are unique within their parent', () => {
    function checkUnique(nodes) {
      const slugs = nodes.map((n) => n.slug);
      const unique = new Set(slugs);
      expect(unique.size).toBe(slugs.length);
      for (const node of nodes) {
        if (node.children) checkUnique(node.children);
      }
    }
    checkUnique(TREE);
  });

  test('General Purpose has no children (leaf at level 1)', () => {
    const general = TREE.find((n) => n.slug === 'general');
    expect(general).toBeDefined();
    expect(general.children).toBeUndefined();
  });
});

describe('BASE_URL', () => {
  test('points to GitHub raw templates directory', () => {
    expect(BASE_URL).toMatch(/^https:\/\/raw\.githubusercontent\.com\//);
    expect(BASE_URL).toContain('/templates');
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
bun test test/navigation.test.js
```

Expected: `Cannot find module '../src/navigation'`

- [ ] **Step 4: Create src/navigation.js**

```javascript
'use strict';

const BASE_URL =
  'https://raw.githubusercontent.com/kulovema2012/init-claude-swe/main/templates';

/**
 * Navigation tree. Each node: { label, slug, children? }
 * children: undefined = leaf node (goes straight to scope selection)
 */
const TREE = [
  {
    label: 'Web Development', slug: 'web',
    children: [
      {
        label: 'Frontend Only', slug: 'frontend',
        children: [
          { label: 'React / Next.js', slug: 'react-nextjs' },
          { label: 'Vue / Nuxt', slug: 'vue-nuxt' },
          { label: 'Svelte / SvelteKit', slug: 'svelte-sveltekit' },
        ],
      },
      {
        label: 'Full-Stack', slug: 'fullstack',
        children: [
          { label: 'Next.js (App Router)', slug: 'nextjs-app-router' },
          { label: 'Remix', slug: 'remix' },
          { label: 'T3 Stack', slug: 't3-stack' },
        ],
      },
      { label: 'Static / Jamstack', slug: 'static-jamstack' },
    ],
  },
  {
    label: 'Mobile Development', slug: 'mobile',
    children: [
      { label: 'React Native', slug: 'react-native' },
      { label: 'Flutter', slug: 'flutter' },
      { label: 'Native (iOS / Android)', slug: 'native' },
    ],
  },
  {
    label: 'Backend / API', slug: 'backend',
    children: [
      { label: 'Node.js / Bun', slug: 'nodejs-bun' },
      {
        label: 'Python', slug: 'python',
        children: [
          { label: 'FastAPI', slug: 'fastapi' },
          { label: 'Django', slug: 'django' },
        ],
      },
      { label: 'Go', slug: 'go' },
      { label: 'GraphQL', slug: 'graphql' },
    ],
  },
  {
    label: 'Data Science', slug: 'data-science',
    children: [
      { label: 'Python (Notebooks / EDA)', slug: 'python-notebooks' },
      { label: 'SQL / Analytics', slug: 'sql-analytics' },
      { label: 'Data Engineering (Pipelines)', slug: 'data-engineering' },
    ],
  },
  {
    label: 'AI / ML Engineering', slug: 'ai-ml',
    children: [
      { label: 'LLM / Agent Development', slug: 'llm-agents' },
      { label: 'Model Training / MLOps', slug: 'model-training' },
      { label: 'Computer Vision', slug: 'computer-vision' },
    ],
  },
  {
    label: 'DevSecOps / Infrastructure', slug: 'devsecops',
    children: [
      { label: 'CI/CD Pipelines', slug: 'cicd-pipelines' },
      { label: 'Kubernetes / Cloud', slug: 'kubernetes-cloud' },
      { label: 'Security Auditing', slug: 'security-auditing' },
    ],
  },
  { label: 'General Purpose', slug: 'general' },
];

module.exports = { TREE, BASE_URL };
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
bun test test/navigation.test.js
```

Expected: `4 tests passed`

- [ ] **Step 6: Commit**

```bash
git add src/navigation.js test/navigation.test.js package.json bun.lock
git commit -m "✨ feat(navigation): add TREE constant and @clack/prompts dependency"
```

---

## Task 2: Create src/utils/resolve.js

**Files:**
- Create: `src/utils/resolve.js`
- Create: `test/resolve.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/resolve.test.js`:

```javascript
'use strict';

const { test, expect, describe } = require('bun:test');
const { buildPaths } = require('../src/utils/resolve');

describe('buildPaths', () => {
  test('builds base URL always pointing to _base', () => {
    // Arrange
    const slugs = ['web', 'fullstack', 'nextjs-app-router'];
    // Act
    const { baseUrl } = buildPaths(slugs);
    // Assert
    expect(baseUrl).toMatch(/\/templates\/_base$/);
  });

  test('builds leaf URL from joined slugs', () => {
    // Arrange
    const slugs = ['web', 'fullstack', 'nextjs-app-router'];
    // Act
    const { leafUrl } = buildPaths(slugs);
    // Assert
    expect(leafUrl).toMatch(/\/templates\/web\/fullstack\/nextjs-app-router$/);
  });

  test('handles single-slug leaf (General Purpose)', () => {
    // Arrange
    const slugs = ['general'];
    // Act
    const { leafUrl } = buildPaths(slugs);
    // Assert
    expect(leafUrl).toMatch(/\/templates\/general$/);
  });

  test('handles two-slug leaf (Mobile / React Native)', () => {
    // Arrange
    const slugs = ['mobile', 'react-native'];
    // Act
    const { leafUrl } = buildPaths(slugs);
    // Assert
    expect(leafUrl).toMatch(/\/templates\/mobile\/react-native$/);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bun test test/resolve.test.js
```

Expected: `Cannot find module '../src/utils/resolve'`

- [ ] **Step 3: Create src/utils/resolve.js**

```javascript
'use strict';

const { BASE_URL } = require('../navigation');

/**
 * Build GitHub raw URLs for base and leaf template directories.
 * @param {string[]} slugs - ordered slug path, e.g. ['web','fullstack','nextjs-app-router']
 * @returns {{ baseUrl: string, leafUrl: string }}
 */
function buildPaths(slugs) {
  const baseUrl = `${BASE_URL}/_base`;
  const leafUrl = `${BASE_URL}/${slugs.join('/')}`;
  return { baseUrl, leafUrl };
}

module.exports = { buildPaths };
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
bun test test/resolve.test.js
```

Expected: `4 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/utils/resolve.js test/resolve.test.js
git commit -m "✨ feat(resolve): add buildPaths for GitHub URL generation"
```

---

## Task 3: Create src/utils/scaffold.js

**Files:**
- Create: `src/utils/scaffold.js`
- Create: `test/scaffold.test.js`

- [ ] **Step 1: Write the failing test**

Create `test/scaffold.test.js`:

```javascript
'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mergeManifests, writeAll } = require('../src/utils/scaffold');

describe('mergeManifests', () => {
  test('base files appear in the merged map', () => {
    // Arrange
    const baseFiles = ['.claude/settings.json', '.claude/rules/testing-aaa.md'];
    const leafFiles = ['CLAUDE.md'];
    // Act
    const map = mergeManifests(baseFiles, leafFiles, 'http://base', 'http://leaf');
    // Assert
    expect(map.has('.claude/settings.json')).toBe(true);
    expect(map.get('.claude/settings.json')).toBe('http://base/.claude/settings.json');
  });

  test('leaf files override base files with same path', () => {
    // Arrange
    const baseFiles = ['.claude/rules/environment-isolation.md'];
    const leafFiles = ['.claude/rules/environment-isolation.md', 'CLAUDE.md'];
    // Act
    const map = mergeManifests(baseFiles, leafFiles, 'http://base', 'http://leaf');
    // Assert
    expect(map.get('.claude/rules/environment-isolation.md'))
      .toBe('http://leaf/.claude/rules/environment-isolation.md');
  });

  test('leaf-only files are included', () => {
    // Arrange
    const baseFiles = ['.claude/settings.json'];
    const leafFiles = ['CLAUDE.md'];
    // Act
    const map = mergeManifests(baseFiles, leafFiles, 'http://base', 'http://leaf');
    // Assert
    expect(map.has('CLAUDE.md')).toBe(true);
    expect(map.get('CLAUDE.md')).toBe('http://leaf/CLAUDE.md');
  });
});

describe('writeAll', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('writes files to correct paths creating subdirs', () => {
    // Arrange
    const contentMap = new Map([
      ['CLAUDE.md', '# Role: Engineer'],
      ['.claude/settings.json', '{}'],
      ['.claude/rules/testing-aaa.md', '# Testing'],
    ]);
    // Act
    writeAll(contentMap, tmpDir, 'project');
    // Assert
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'rules', 'testing-aaa.md'))).toBe(true);
  });

  test('writes CLAUDE.local.md for local scope', () => {
    // Arrange
    const contentMap = new Map([['CLAUDE.md', '# Role']]);
    // Act
    writeAll(contentMap, tmpDir, 'local');
    // Assert
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.local.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
  });

  test('writes correct file content', () => {
    // Arrange
    const contentMap = new Map([['CLAUDE.md', '# My Role Content']]);
    // Act
    writeAll(contentMap, tmpDir, 'project');
    // Assert
    expect(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8')).toBe('# My Role Content');
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
bun test test/scaffold.test.js
```

Expected: `Cannot find module '../src/utils/scaffold'`

- [ ] **Step 3: Create src/utils/scaffold.js**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Merge base and leaf file lists into a fetch URL map.
 * Leaf entries override base entries with the same relative path.
 * @param {string[]} baseFiles - relative paths from base MANIFEST
 * @param {string[]} leafFiles - relative paths from leaf MANIFEST
 * @param {string} baseUrl - raw GitHub URL of _base/ directory
 * @param {string} leafUrl - raw GitHub URL of leaf directory
 * @returns {Map<string, string>} Map<relativePath, fetchUrl>
 */
function mergeManifests(baseFiles, leafFiles, baseUrl, leafUrl) {
  const map = new Map();
  for (const f of baseFiles) {
    map.set(f, `${baseUrl}/${f}`);
  }
  for (const f of leafFiles) {
    map.set(f, `${leafUrl}/${f}`);
  }
  return map;
}

/**
 * Write fetched file contents to disk, creating subdirectories as needed.
 * For local scope, renames CLAUDE.md → CLAUDE.local.md.
 * @param {Map<string, string>} contentMap - Map<relativePath, fileContent>
 * @param {string} cwd - target directory
 * @param {string} scope - 'project' | 'local'
 */
function writeAll(contentMap, cwd, scope) {
  for (const [filePath, content] of contentMap) {
    const destPath =
      scope === 'local' && filePath === 'CLAUDE.md' ? 'CLAUDE.local.md' : filePath;
    const fullPath = path.join(cwd, destPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }
}

module.exports = { mergeManifests, writeAll };
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
bun test test/scaffold.test.js
```

Expected: `6 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/utils/scaffold.js test/scaffold.test.js
git commit -m "✨ feat(scaffold): add mergeManifests and writeAll"
```

---

## Task 4: Extend src/utils/fetch.js

**Files:**
- Modify: `src/utils/fetch.js`
- Modify: `test/fetch.test.js`

- [ ] **Step 1: Add new failing tests to test/fetch.test.js**

Append these describe blocks to the existing `test/fetch.test.js` (after the closing of the existing `fetchFile` describe):

```javascript
const { fetchManifest, fetchFiles } = require('../src/utils/fetch');

describe('fetchManifest', () => {
  let server;
  let port;

  beforeEach(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/ok/MANIFEST.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ version: '1.0', files: ['CLAUDE.md', '.claude/settings.json'] }));
      } else if (req.url === '/bad/MANIFEST.json') {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('returns files array from MANIFEST.json', async () => {
    // Arrange
    const url = `http://127.0.0.1:${port}/ok`;
    // Act
    const files = await fetchManifest(url, http);
    // Assert
    expect(files).toEqual(['CLAUDE.md', '.claude/settings.json']);
  });

  test('throws on non-200 MANIFEST response', async () => {
    // Arrange
    const url = `http://127.0.0.1:${port}/bad`;
    // Act & Assert
    await expect(fetchManifest(url, http)).rejects.toThrow('HTTP 404');
  });
});

describe('fetchFiles', () => {
  let server;
  let port;

  beforeEach(async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end(`content of ${req.url}`);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('fetches all files and returns content map', async () => {
    // Arrange
    const urlMap = new Map([
      ['CLAUDE.md', `http://127.0.0.1:${port}/CLAUDE.md`],
      ['.claude/settings.json', `http://127.0.0.1:${port}/.claude/settings.json`],
    ]);
    // Act
    const contentMap = await fetchFiles(urlMap, http);
    // Assert
    expect(contentMap.size).toBe(2);
    expect(contentMap.has('CLAUDE.md')).toBe(true);
    expect(contentMap.has('.claude/settings.json')).toBe(true);
  });

  test('calls onProgress for each file', async () => {
    // Arrange
    const urlMap = new Map([
      ['a.md', `http://127.0.0.1:${port}/a.md`],
      ['b.md', `http://127.0.0.1:${port}/b.md`],
    ]);
    const calls = [];
    // Act
    await fetchFiles(urlMap, http, (info) => calls.push(info));
    // Assert
    expect(calls).toHaveLength(2);
    expect(calls.every((c) => c.total === 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to confirm new tests fail**

```bash
bun test test/fetch.test.js
```

Expected: existing tests pass, new `fetchManifest` / `fetchFiles` tests fail with `fetchManifest is not a function`.

- [ ] **Step 3: Add fetchManifest and fetchFiles to src/utils/fetch.js**

Append to the existing `src/utils/fetch.js` (before `module.exports`):

```javascript
/**
 * Fetch and parse a MANIFEST.json file, returning its files array.
 * @param {string} dirUrl - directory URL (no trailing slash)
 * @param {object} [transport]
 * @returns {Promise<string[]>}
 */
async function fetchManifest(dirUrl, transport) {
  const content = await fetchFile(`${dirUrl}/MANIFEST.json`, TIMEOUT_MS, transport);
  const parsed = JSON.parse(content);
  return parsed.files;
}

/**
 * Fetch all files from a URL map in parallel.
 * Retries each file once on failure; throws if retry also fails.
 * @param {Map<string, string>} urlMap - Map<relativePath, fetchUrl>
 * @param {object} [transport]
 * @param {function} [onProgress] - called after each file: ({ done, total, filePath })
 * @returns {Promise<Map<string, string>>} Map<relativePath, content>
 */
async function fetchFiles(urlMap, transport, onProgress) {
  const entries = [...urlMap.entries()];
  const total = entries.length;
  let done = 0;
  const contentMap = new Map();

  await Promise.all(
    entries.map(async ([filePath, url]) => {
      let content;
      try {
        content = await fetchFile(url, TIMEOUT_MS, transport);
      } catch (_) {
        // retry once
        content = await fetchFile(url, TIMEOUT_MS, transport);
      }
      contentMap.set(filePath, content);
      done++;
      if (onProgress) onProgress({ done, total, filePath });
    })
  );

  return contentMap;
}
```

Update `module.exports` at the bottom:

```javascript
module.exports = { fetchFile, fetchManifest, fetchFiles, TIMEOUT_MS };
```

- [ ] **Step 4: Run all fetch tests to confirm they pass**

```bash
bun test test/fetch.test.js
```

Expected: all tests pass (original 4 + new 4 = 8 total).

- [ ] **Step 5: Commit**

```bash
git add src/utils/fetch.js test/fetch.test.js
git commit -m "✨ feat(fetch): add fetchManifest and fetchFiles with parallel support"
```

---

## Task 5: Replace src/utils/prompt.js

**Files:**
- Replace: `src/utils/prompt.js`
- Replace: `test/prompt.test.js`

- [ ] **Step 1: Write new failing tests**

Replace `test/prompt.test.js` entirely:

```javascript
'use strict';

const { test, expect, describe } = require('bun:test');
const { promptSelections, promptOverwrite } = require('../src/utils/prompt');

describe('promptSelections (simulate mode)', () => {
  test('returns slugs and scope from simulate object', async () => {
    // Arrange
    const simulate = { slugs: ['web', 'fullstack', 'nextjs-app-router'], scope: 'project' };
    // Act
    const result = await promptSelections({ simulate });
    // Assert
    expect(result.slugs).toEqual(['web', 'fullstack', 'nextjs-app-router']);
    expect(result.scope).toBe('project');
  });

  test('returns local scope when specified', async () => {
    // Arrange
    const simulate = { slugs: ['general'], scope: 'local' };
    // Act
    const result = await promptSelections({ simulate });
    // Assert
    expect(result.scope).toBe('local');
  });

  test('works for two-level selections (mobile/react-native)', async () => {
    // Arrange
    const simulate = { slugs: ['mobile', 'react-native'], scope: 'project' };
    // Act
    const result = await promptSelections({ simulate });
    // Assert
    expect(result.slugs).toEqual(['mobile', 'react-native']);
  });
});

describe('promptOverwrite (simulate mode)', () => {
  test('returns true when simulate is true', async () => {
    // Arrange / Act
    const result = await promptOverwrite({ simulate: true });
    // Assert
    expect(result).toBe(true);
  });

  test('returns false when simulate is false', async () => {
    // Arrange / Act
    const result = await promptOverwrite({ simulate: false });
    // Assert
    expect(result).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
bun test test/prompt.test.js
```

Expected: fails — `promptSelections is not a function` (old API exports different functions).

- [ ] **Step 3: Replace src/utils/prompt.js**

```javascript
'use strict';

const { TREE } = require('../navigation');

/**
 * Run multi-level category/type/stack + scope prompts.
 * In simulate mode, returns opts.simulate directly (for testing).
 * @param {object} [opts]
 * @param {{ slugs: string[], scope: string }} [opts.simulate] - bypass clack for testing
 * @returns {Promise<{ slugs: string[], scope: string }>}
 */
async function promptSelections(opts = {}) {
  if (opts.simulate !== undefined) return opts.simulate;

  const { select, isCancel, cancel } = await import('@clack/prompts');

  function check(result) {
    if (isCancel(result)) { cancel('Operation cancelled.'); process.exit(0); }
    return result;
  }

  const slugs = [];

  // Level 1: Category
  const catSlug = check(await select({
    message: 'What are you building?',
    options: TREE.map((n) => ({ value: n.slug, label: n.label })),
  }));
  slugs.push(catSlug);
  const catNode = TREE.find((n) => n.slug === catSlug);

  if (catNode && catNode.children) {
    // Level 2: Sub-type
    const typeSlug = check(await select({
      message: 'Project type?',
      options: catNode.children.map((n) => ({ value: n.slug, label: n.label })),
    }));
    slugs.push(typeSlug);
    const typeNode = catNode.children.find((n) => n.slug === typeSlug);

    if (typeNode && typeNode.children) {
      // Level 3: Stack
      const stackSlug = check(await select({
        message: 'Stack?',
        options: typeNode.children.map((n) => ({ value: n.slug, label: n.label })),
      }));
      slugs.push(stackSlug);
    }
  }

  // Scope
  const scope = check(await select({
    message: 'Install scope?',
    options: [
      { value: 'project', label: 'project', hint: 'CLAUDE.md — committed to git' },
      { value: 'local', label: 'local', hint: 'CLAUDE.local.md — gitignored' },
    ],
  }));

  return { slugs, scope };
}

/**
 * Prompt to confirm overwriting existing files.
 * @param {object} [opts]
 * @param {boolean} [opts.simulate] - bypass clack for testing
 * @returns {Promise<boolean>}
 */
async function promptOverwrite(opts = {}) {
  if (opts.simulate !== undefined) return opts.simulate;
  const { confirm, isCancel, cancel } = await import('@clack/prompts');
  const result = await confirm({ message: 'Files already exist — overwrite?' });
  if (isCancel(result)) { cancel('Operation cancelled.'); process.exit(0); }
  return result;
}

module.exports = { promptSelections, promptOverwrite };
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun test test/prompt.test.js
```

Expected: `5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/utils/prompt.js test/prompt.test.js
git commit -m "♻️ refactor(prompt): replace readline with @clack/prompts multi-level selector"
```

---

## Task 6: Rewrite src/commands/install.js

**Files:**
- Rewrite: `src/commands/install.js`
- Replace: `test/install.test.js`

- [ ] **Step 1: Write new failing tests**

Replace `test/install.test.js` entirely:

```javascript
'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { install } = require('../src/commands/install');

/** Builds a mock HTTP server that serves MANIFEST.json and file contents. */
function makeServer(baseFiles, leafFiles) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/_base/MANIFEST.json') {
        res.writeHead(200); res.end(JSON.stringify({ version: '1.0', files: baseFiles }));
      } else if (req.url === '/leaf/MANIFEST.json') {
        res.writeHead(200); res.end(JSON.stringify({ version: '1.0', files: leafFiles }));
      } else {
        res.writeHead(200); res.end(`# content for ${req.url}`);
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

describe('install', () => {
  let tmpDir;
  let server;
  let port;

  const baseFiles = ['.claude/settings.json', '.claude/rules/testing-aaa.md'];
  const leafFiles = ['CLAUDE.md', '.claude/rules/environment-isolation.md'];

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'install-test-'));
    server = await makeServer(baseFiles, leafFiles);
    port = server.address().port;
  });

  afterEach(async () => {
    fs.rmSync(tmpDir, { recursive: true });
    await new Promise((resolve) => server.close(resolve));
  });

  function makeOpts(extra = {}) {
    return {
      cwd: tmpDir,
      isTTY: false,
      fetchTransport: http,
      baseUrl: `http://127.0.0.1:${port}/_base`,
      leafUrl: `http://127.0.0.1:${port}/leaf`,
      simulate: { slugs: ['web', 'fullstack', 'nextjs-app-router'], scope: 'project' },
      ...extra,
    };
  }

  test('writes CLAUDE.md and .claude/ files for project scope', async () => {
    // Arrange / Act
    await install(makeOpts());
    // Assert
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'rules', 'testing-aaa.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'rules', 'environment-isolation.md'))).toBe(true);
  });

  test('writes CLAUDE.local.md for local scope', async () => {
    // Arrange / Act
    await install(makeOpts({ simulate: { slugs: ['general'], scope: 'local' } }));
    // Assert
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.local.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
  });

  test('adds CLAUDE.local.md to .gitignore for local scope', async () => {
    // Arrange / Act
    await install(makeOpts({ simulate: { slugs: ['general'], scope: 'local' } }));
    // Assert
    const gitignore = path.join(tmpDir, '.gitignore');
    expect(fs.readFileSync(gitignore, 'utf8')).toContain('CLAUDE.local.md');
  });

  test('does NOT add CLAUDE.md to .gitignore for project scope', async () => {
    // Arrange / Act
    await install(makeOpts());
    // Assert
    const gitignorePath = path.join(tmpDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      expect(fs.readFileSync(gitignorePath, 'utf8')).not.toContain('CLAUDE.md');
    } else {
      expect(true).toBe(true); // no .gitignore created — also fine
    }
  });

  test('throws when CLAUDE.md exists and isTTY is false and yes is not set', async () => {
    // Arrange
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'old');
    // Act & Assert
    await expect(install(makeOpts())).rejects.toThrow('already exists');
  });

  test('overwrites when overwrite=true', async () => {
    // Arrange
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'old content');
    // Act
    await install(makeOpts({ overwrite: true }));
    // Assert
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('content for');
  });

  test('returns filename, stackLabel, scope, and filesWritten', async () => {
    // Arrange / Act
    const result = await install(makeOpts());
    // Assert
    expect(result.filename).toBe('CLAUDE.md');
    expect(result.scope).toBe('project');
    expect(Array.isArray(result.filesWritten)).toBe(true);
    expect(result.filesWritten.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
bun test test/install.test.js
```

Expected: failures related to old API (missing `baseUrl`/`leafUrl` opts, wrong return shape).

- [ ] **Step 3: Rewrite src/commands/install.js**

```javascript
'use strict';

const fs = require('fs');
const path = require('path');
const { fetchManifest, fetchFiles } = require('../utils/fetch');
const { ensureGitignoreEntry } = require('../utils/gitignore');
const { promptSelections, promptOverwrite } = require('../utils/prompt');
const { buildPaths } = require('../utils/resolve');
const { mergeManifests, writeAll } = require('../utils/scaffold');

/**
 * Core install logic — orchestrates the full scaffold pipeline.
 * @param {object} opts
 * @param {string} [opts.category]       CI flag: category slug
 * @param {string} [opts.type]           CI flag: type slug
 * @param {string} [opts.stack]          CI flag: stack slug
 * @param {string} [opts.scope]          CI flag: 'project' | 'local'
 * @param {boolean} [opts.yes]           skip overwrite prompt
 * @param {boolean} [opts.overwrite]     force overwrite (testing)
 * @param {string} opts.cwd              working directory
 * @param {boolean} opts.isTTY           whether stdin is a TTY
 * @param {object} [opts.fetchTransport] injectable transport for testing
 * @param {string} [opts.baseUrl]        override base URL (testing)
 * @param {string} [opts.leafUrl]        override leaf URL (testing)
 * @param {function} [opts.onProgress]   progress callback ({ done, total, filePath })
 * @param {{ slugs: string[], scope: string }} [opts.simulate]  inject prompt answers (testing)
 * @returns {Promise<{ filename: string, stackLabel: string, scope: string, filesWritten: string[] }>}
 */
async function install(opts) {
  const cwd = opts.cwd || process.cwd();
  const isTTY = opts.isTTY !== undefined ? opts.isTTY : !!process.stdin.isTTY;

  // 1. Resolve selections (prompt, CI flags, or simulate)
  let slugs, scope;
  if (opts.simulate) {
    ({ slugs, scope } = opts.simulate);
  } else if (opts.category && opts.scope) {
    slugs = [opts.category, opts.type, opts.stack].filter(Boolean);
    scope = opts.scope;
  } else if (isTTY) {
    ({ slugs, scope } = await promptSelections());
  } else {
    throw new Error(
      'Non-interactive mode requires --category and --scope flags.'
    );
  }

  // 2. Build GitHub URLs (override allowed for testing)
  const { baseUrl, leafUrl } =
    opts.baseUrl
      ? { baseUrl: opts.baseUrl, leafUrl: opts.leafUrl }
      : buildPaths(slugs);

  // 3. Fetch manifests (abort on failure — no partial writes)
  let baseFiles, leafFiles;
  try {
    [baseFiles, leafFiles] = await Promise.all([
      fetchManifest(baseUrl, opts.fetchTransport),
      fetchManifest(leafUrl, opts.fetchTransport),
    ]);
  } catch (err) {
    throw new Error(`Failed to fetch manifest: ${err.message}`);
  }

  // 4. Merge into URL map (leaf overrides base on same path)
  const urlMap = mergeManifests(baseFiles, leafFiles, baseUrl, leafUrl);

  // 5. Check for existing destination file
  const destFile = scope === 'local' ? 'CLAUDE.local.md' : 'CLAUDE.md';
  const destPath = path.join(cwd, destFile);
  if (fs.existsSync(destPath)) {
    if (opts.overwrite || opts.yes) {
      // skip prompt
    } else if (!isTTY) {
      throw new Error(
        `${destFile} already exists. Use --yes or run in interactive mode.`
      );
    } else {
      const overwrite = await promptOverwrite();
      if (!overwrite) throw new Error('Aborted.');
    }
  }

  // 6. Fetch all files in parallel
  const contentMap = await fetchFiles(urlMap, opts.fetchTransport, opts.onProgress);

  // 7. Write to disk atomically
  writeAll(contentMap, cwd, scope);

  // 8. Gitignore for local scope only
  if (scope === 'local') {
    ensureGitignoreEntry(cwd, 'CLAUDE.local.md');
  }

  const stackLabel = slugs[slugs.length - 1] || 'general';
  return { filename: destFile, stackLabel, scope, filesWritten: [...contentMap.keys()] };
}

module.exports = { install };
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun test test/install.test.js
```

Expected: `7 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/commands/install.js test/install.test.js
git commit -m "♻️ refactor(install): rewrite for full scaffold pipeline"
```

---

## Task 7: Update src/cli.js

**Files:**
- Modify: `src/cli.js`
- Modify: `test/cli.test.js`
- Delete: `src/templates.js`

- [ ] **Step 1: Update failing tests**

Replace `test/cli.test.js`:

```javascript
'use strict';

const { test, expect, describe } = require('bun:test');
const { createProgram } = require('../src/cli');

describe('createProgram', () => {
  test('has install as default command', () => {
    // Arrange
    const program = createProgram();
    // Act
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Assert
    expect(installCmd).toBeDefined();
  });

  test('has --scope option', () => {
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    const opts = installCmd.options.map((o) => o.long);
    expect(opts).toContain('--scope');
  });

  test('has --yes option', () => {
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    const opts = installCmd.options.map((o) => o.long);
    expect(opts).toContain('--yes');
  });

  test('has --category option', () => {
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    const opts = installCmd.options.map((o) => o.long);
    expect(opts).toContain('--category');
  });

  test('has --stack option', () => {
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    const opts = installCmd.options.map((o) => o.long);
    expect(opts).toContain('--stack');
  });
});
```

- [ ] **Step 2: Run to confirm --yes/--category/--stack tests fail**

```bash
bun test test/cli.test.js
```

Expected: 2 existing tests pass, 3 new tests fail.

- [ ] **Step 3: Update src/cli.js**

```javascript
'use strict';

const { Command } = require('commander');
const { install } = require('./commands/install');
const pkg = require('../package.json');

async function getClack() {
  return import('@clack/prompts');
}

function createProgram() {
  const program = new Command();

  program
    .name('init-claude-swe')
    .description('Claude Code scaffold installer')
    .version(pkg.version);

  program
    .command('install', { isDefault: true })
    .description('Scaffold .claude/ directory for your project')
    .option('--category <category>', 'Category slug (CI mode)')
    .option('--type <type>', 'Type slug (CI mode)')
    .option('--stack <stack>', 'Stack slug (CI mode)')
    .option('-s, --scope <scope>', 'Scope: project or local (CI mode)')
    .option('-y, --yes', 'Skip overwrite confirmation')
    .action(async (opts) => {
      const { intro, outro } = await getClack();
      intro(`init-claude-swe  v${pkg.version} — Claude Code scaffold installer`);
      try {
        const result = await install({
          category: opts.category,
          type: opts.type,
          stack: opts.stack,
          scope: opts.scope,
          yes: opts.yes,
          cwd: process.cwd(),
          isTTY: !!process.stdin.isTTY,
        });
        outro(
          `All done! Scaffold installed for ${result.stackLabel}.\n\n` +
          `  Next steps:\n` +
          `  1. Open Claude Code in this directory\n` +
          `  2. Review CLAUDE.md for your role setup\n` +
          `  3. Explore .claude/rules/ to customise your workflow`
        );
      } catch (err) {
        process.stderr.write(err.message + '\n');
        process.exit(1);
      }
    });

  return program;
}

async function run(argv) {
  const program = createProgram();
  await program.parseAsync(argv);
}

module.exports = { createProgram, run };
```

- [ ] **Step 4: Run all tests to confirm they pass**

```bash
bun test test/cli.test.js
```

Expected: `5 tests passed`

- [ ] **Step 5: Delete src/templates.js (no longer needed)**

```bash
rm src/templates.js
```

- [ ] **Step 6: Run full test suite to confirm nothing broke**

```bash
bun test
```

Expected: all tests pass across all test files.

- [ ] **Step 7: Commit**

```bash
git add src/cli.js test/cli.test.js
git rm src/templates.js
git commit -m "♻️ refactor(cli): add clack intro/outro and CI flags, remove templates.js"
```

---

## Task 8: Create _base/ template files

**Files:**
- Create: `templates/_base/MANIFEST.json`
- Create: `templates/_base/.claude/settings.json`
- Create: `templates/_base/.claude/rules/environment-isolation.md`
- Create: `templates/_base/.claude/rules/testing-aaa.md`
- Create: `templates/_base/.claude/rules/observability.md`
- Create: `templates/_base/.claude/rules/git-workflow.md`
- Create: `templates/_base/.claude/rules/project-organization.md`
- Create: `templates/_base/.claude/rules/tool-selection.md`
- Create: `templates/_base/.claude/rules/skills-catalog.md`
- Create: `templates/_base/.claude/rules/agents-catalog.md`

- [ ] **Step 1: Create MANIFEST.json**

`templates/_base/MANIFEST.json`:
```json
{
  "version": "1.0",
  "files": [
    ".claude/settings.json",
    ".claude/rules/environment-isolation.md",
    ".claude/rules/testing-aaa.md",
    ".claude/rules/observability.md",
    ".claude/rules/git-workflow.md",
    ".claude/rules/project-organization.md",
    ".claude/rules/tool-selection.md",
    ".claude/rules/skills-catalog.md",
    ".claude/rules/agents-catalog.md"
  ]
}
```

- [ ] **Step 2: Create settings.json**

`templates/_base/.claude/settings.json`:
```json
{
  "enabledPlugins": {
    "agent-teams@claude-code-workflows": true,
    "feature-dev@claude-plugins-official": true,
    "code-review@claude-plugins-official": true
  }
}
```

- [ ] **Step 3: Create environment-isolation.md (base — generic, always overridden by stack)**

`templates/_base/.claude/rules/environment-isolation.md`:
```markdown
# Environment & Isolation

## Gitignore First
Before writing any project code, add to `.gitignore`:
- `node_modules/` / `.venv/` / build folders
- `.env` (never commit secrets)
- `.claude/` (AI tooling is local)

## Task Isolation
Every feature or bugfix lives in an isolated git worktree.
Do not write code that breaks the main branch state.

## Package Manager
Use the package manager specified in CLAUDE.md Key Commands.
- JS/TS: **bun** exclusively (`bun add`, `bun run`, `bun test`)
- Python: **uv** exclusively (`uv add`, `uv run`, `uv venv`)
Never use npm, yarn, pnpm, pip, poetry, or pipenv.

## Environment Variables
- `.env` — local dev only, never commit
- `.env.example` — committed template with placeholder values
- Validate all env vars at startup; fail fast with a clear message if any are missing
```

- [ ] **Step 4: Create testing-aaa.md**

`templates/_base/.claude/rules/testing-aaa.md`:
```markdown
# Testing Standards — A.A.A. Framework

All unit tests MUST follow the Arrange-Act-Assert pattern.

## Required Structure

Every test must have three explicit sections:
- **Arrange** — set up state, mocks, and input data
- **Act** — execute the single unit under test
- **Assert** — verify the exact expected outcome

## Rules

- Every piece of business logic has a co-located unit test
- Tests run with the project's test command (see CLAUDE.md Key Commands)
- Mock external dependencies (DB, HTTP, file system) — test logic, not infrastructure
- One behaviour per test case with a descriptive name
- Prefer real implementations over mocks where fast and practical

## TDD Workflow

1. Write the failing test first
2. Run it — confirm it fails with the expected error
3. Write minimal implementation to make it pass
4. Refactor without breaking tests
5. Commit

## When to Write Tests

| Layer | Required? |
|-------|-----------|
| Business logic / domain functions | ✅ Always |
| API handlers / server actions | ✅ Always |
| Utility functions with branching | ✅ Always |
| UI components with logic | ⚠️ Should |
| Pure presentational components | ❌ Optional |
| Third-party SDK wrappers | ❌ Skip |
```

- [ ] **Step 5: Create observability.md**

`templates/_base/.claude/rules/observability.md`:
```markdown
# Observability — No Raw Logs in Production

## Rule: No console.log / print()

Never leave raw `console.log()`, `console.error()`, or `print()` in production code.
Use the project's structured logger instead (see CLAUDE.md Key Commands for import path).

## Structured Logging

All log entries must be JSON with at minimum:
- `level` — info | warn | error | debug
- `message` — human-readable description
- `timestamp` — ISO 8601

Include contextual IDs for traceability:
- `userId`, `requestId`, `traceId` — whatever is relevant to the domain
- On errors: always include the original error message and stack

## Log Levels

| Level | When to use |
|-------|-------------|
| `error` | Unexpected failures that need investigation |
| `warn` | Recoverable issues, degraded behaviour |
| `info` | Key business events (user signed in, order placed) |
| `debug` | Developer diagnostics — stripped in production |

## Where to Log

- ✅ Service/handler boundaries (entry + exit of key operations)
- ✅ External calls (DB, API) on failure
- ✅ Background jobs — start, end, duration
- ❌ Inside tight loops
- ❌ Middleware on every request (only on auth failure)

## Monitoring Stack Reference

Production monitoring: **Loki** (logs) · **Grafana** (dashboards) · **Tempo** (traces) · **Prometheus** (metrics)
```

- [ ] **Step 6: Create git-workflow.md**

`templates/_base/.claude/rules/git-workflow.md`:
```markdown
# Git Workflow — Strict Atomic Pushing

## The Rule

Every logical change must be committed and pushed immediately.

```
Change → Test → Lint → Stage → Commit → Push → Next Change
```

Never batch unrelated changes. Never leave uncommitted work at session end.

## Commit Message Format (Gitmoji Standard)

```
<emoji> <type>(<scope>): <description>
```

| Emoji | Type | Usage |
|-------|------|-------|
| ✨ | feat | New feature |
| 🐛 | fix | Bug fix |
| ♻️ | refactor | Improve without behaviour change |
| 📝 | docs | Documentation |
| ✅ | test | Add or update tests |
| 🔧 | chore | Maintenance |
| ⚡ | perf | Performance improvement |
| 🎨 | style | Formatting only |
| 🧪 | experiment | Non-production exploration |

**Example:** `git commit -m "✨ feat(auth): add JWT refresh token rotation"`

## Staging

Always stage specific files — never `git add .` or `git add -A`.
This prevents accidentally committing `.env`, secrets, or build artefacts.

## Branch Naming

- Features: `feat/<short-description>`
- Fixes: `fix/<short-description>`
```

- [ ] **Step 7: Create project-organization.md**

`templates/_base/.claude/rules/project-organization.md`:
```markdown
# Project Organisation

## CLAUDE.md Scaling Rule

Keep CLAUDE.md under 200 lines. When it grows beyond that:
1. Create `.claude/rules/<topic>.md` for each concern
2. Reference rules via `@.claude/rules/<topic>.md` imports in CLAUDE.md
3. Rules are discovered recursively — organise into subdirectories if needed

## Pointer Architecture

Local rule files are **routers only** — they point to co-located documentation,
never contain rules themselves. Place descriptive files next to the source they describe.

## Path-Specific Rules

Scope rules to files using YAML frontmatter:

```yaml
---
paths:
  - "src/api/**/*.ts"
---
```

Rules without `paths` apply globally.

## Single Responsibility

- One module = one responsibility
- Files that change together live together
- Split by domain/responsibility, not by technical layer
- When a file grows unwieldy, a split is the right call

## Feature Addition Order

Schema → Migration → Queries → Service/Action → Route/Handler → UI → Tests
```

- [ ] **Step 8: Create tool-selection.md**

`templates/_base/.claude/rules/tool-selection.md`:
```markdown
# Tool & Agent Selection

## Skill Invocation Order

Invoke the relevant skill BEFORE any response when there is even a 1% chance it applies.

| Task Type | Skill to Invoke First |
|-----------|----------------------|
| New feature or component | `superpowers:brainstorming` |
| Bug fix / unexpected behaviour | `superpowers:systematic-debugging` |
| Multi-step implementation | `superpowers:writing-plans` |
| Executing an existing plan | `superpowers:executing-plans` |
| Before claiming work is done | `superpowers:verification-before-completion` |
| Any code change | `superpowers:test-driven-development` |
| 2+ independent tasks | `superpowers:dispatching-parallel-agents` |

## Agent Selection

| Agent | When to Use |
|-------|-------------|
| `Explore` | Codebase exploration, finding files, understanding architecture |
| `Plan` | Implementation strategy, architectural decisions |
| `application-performance:frontend-developer` | UI components, React, CSS |
| `api-scaffolding:backend-architect` | API design, service boundaries |
| `database-design:database-architect` | Schema design, migrations |
| `backend-development:security-auditor` | Security review |
| `backend-development:performance-engineer` | Optimisation |
| `agent-teams:team-lead` | 3+ tasks, multi-domain, parallel workstreams |

## Agent Team Trigger

Dispatch a team when the task has **3 or more distinct steps** OR touches **2+ domains**.

Workflow: `brainstorming → dispatching-parallel-agents → team-spawn → team-status → team-shutdown`
```

- [ ] **Step 9: Create skills-catalog.md**

`templates/_base/.claude/rules/skills-catalog.md`:
```markdown
# Skills Catalog

Invoke skills with the `Skill` tool BEFORE taking action.

## Core Workflows (superpowers)

| Skill | Trigger |
|-------|---------|
| `superpowers:brainstorming` | Starting any feature/design |
| `superpowers:systematic-debugging` | Any bug or unexpected behaviour |
| `superpowers:writing-plans` | Creating implementation plans |
| `superpowers:executing-plans` | Working through an existing plan |
| `superpowers:verification-before-completion` | Before saying "done" |
| `superpowers:test-driven-development` | Any code change |
| `superpowers:dispatching-parallel-agents` | 2+ independent tasks |
| `superpowers:using-git-worktrees` | Feature branch isolation |
| `superpowers:finishing-a-development-branch` | Merging a feature branch |
| `superpowers:requesting-code-review` | Before PR |
| `superpowers:receiving-code-review` | Acting on review feedback |

## Agent Teams

| Skill | Purpose |
|-------|---------|
| `agent-teams:team-spawn` | Start a multi-agent team |
| `agent-teams:team-feature` | Parallel feature development |
| `agent-teams:team-debug` | Parallel debugging investigation |
| `agent-teams:team-review` | Multi-dimension code review |
| `agent-teams:team-status` | Check team progress |
| `agent-teams:team-shutdown` | Shut down team, collect results |

## Code Quality

| Skill | Purpose |
|-------|---------|
| `comprehensive-review:full-review` | Architecture + security + performance |
| `tdd-workflows:tdd-cycle` | Full red-green-refactor cycle |
| `git-pr-workflows:git-workflow` | PR and branch management |

## Backend & Infrastructure

| Skill | Purpose |
|-------|---------|
| `backend-development:feature-development` | Backend feature scaffold |
| `cicd-automation:deployment-pipeline-design` | CI/CD pipeline design |
| `cloud-infrastructure:terraform-specialist` | IaC automation |
| `database-migrations:sql-migrations` | Safe SQL migrations |

## Frontend & Full-Stack

| Skill | Purpose |
|-------|---------|
| `vercel:nextjs` | Next.js best practices |
| `vercel:ai-sdk` | Vercel AI SDK integration |
| `vercel:deploy` | Vercel deployment |
| `vercel:shadcn` | Shadcn UI components |
```

- [ ] **Step 10: Create agents-catalog.md**

`templates/_base/.claude/rules/agents-catalog.md`:
```markdown
# Agents Catalog

Select the agent best matched to the task domain.

## Exploration & Planning

| Agent | Use For |
|-------|---------|
| `Explore` | Finding files, understanding architecture, codebase maps |
| `Plan` | Implementation strategy, trade-off analysis |
| `general-purpose` | Complex multi-step research across domains |

## Frontend

| Agent | Use For |
|-------|---------|
| `application-performance:frontend-developer` | React components, layouts, state |
| `vercel:performance-optimizer` | Core Web Vitals, bundle optimisation |

## Backend

| Agent | Use For |
|-------|---------|
| `api-scaffolding:backend-architect` | API design, microservices, REST/GraphQL |
| `api-scaffolding:fastapi-pro` | FastAPI, async Python APIs |
| `api-scaffolding:django-pro` | Django, DRF, ORM |
| `backend-development:performance-engineer` | Query and response optimisation |
| `backend-development:security-auditor` | OWASP, auth, secrets review |
| `backend-development:tdd-orchestrator` | TDD enforcement across team |

## Database

| Agent | Use For |
|-------|---------|
| `database-design:database-architect` | Schema design, tech selection |
| `database-design:sql-pro` | Query optimisation, OLAP/OLTP |
| `database-migrations:database-optimizer` | Index tuning, performance |

## Infrastructure & DevOps

| Agent | Use For |
|-------|---------|
| `cicd-automation:deployment-engineer` | CI/CD pipelines, GitOps |
| `cicd-automation:kubernetes-architect` | K8s, EKS/GKE/AKS |
| `cicd-automation:terraform-specialist` | IaC, state management |
| `cicd-automation:devops-troubleshooter` | Incident response, debugging |
| `cloud-infrastructure:cloud-architect` | Multi-cloud, FinOps, DR |

## Quality & Monitoring

| Agent | Use For |
|-------|---------|
| `comprehensive-review:code-reviewer` | Code quality, security, performance |
| `observability-monitoring:observability-engineer` | Logging, tracing, SLOs |
| `debugging-toolkit:debugger` | Errors, test failures, unexpected behaviour |

## Agent Teams

| Agent | Use For |
|-------|---------|
| `agent-teams:team-lead` | Orchestrate parallel workstreams |
| `agent-teams:team-implementer` | Parallel feature building |
| `agent-teams:team-debugger` | Hypothesis-driven debugging |
| `agent-teams:team-reviewer` | Parallel multi-dimension review |
```

- [ ] **Step 11: Commit all _base/ files**

```bash
git add templates/_base/
git commit -m "✨ feat(templates): add _base scaffold with 8 shared rule files"
```

---

## Task 9: Create Web Development templates

For every stack, create two files:
1. `templates/<path>/MANIFEST.json` — always lists `CLAUDE.md` + `.claude/rules/environment-isolation.md`
2. `templates/<path>/CLAUDE.md` — role prompt, ~80 lines
3. `templates/<path>/.claude/rules/environment-isolation.md` — stack-specific env rules

**Shared MANIFEST.json** (identical for every stack leaf):
```json
{
  "version": "1.0",
  "files": [
    "CLAUDE.md",
    ".claude/rules/environment-isolation.md"
  ]
}
```

---

### web/fullstack/nextjs-app-router (reference — full content shown)

- [ ] **Step 1: Create MANIFEST.json**

`templates/web/fullstack/nextjs-app-router/MANIFEST.json`:
```json
{
  "version": "1.0",
  "files": [
    "CLAUDE.md",
    ".claude/rules/environment-isolation.md"
  ]
}
```

- [ ] **Step 2: Create CLAUDE.md**

`templates/web/fullstack/nextjs-app-router/CLAUDE.md`:
```markdown
# Role: Principal Full-Stack Engineer (Next.js App Router)
You are an elite senior engineer specialising in Next.js 15 App Router, React 19 Server Components,
and modern full-stack TypeScript. You prioritise RSC-first architecture, type safety, and atomic delivery.

## Quick Reference
@.claude/rules/environment-isolation.md
@.claude/rules/testing-aaa.md
@.claude/rules/observability.md
@.claude/rules/git-workflow.md
@.claude/rules/project-organization.md
@.claude/rules/tool-selection.md
@.claude/rules/skills-catalog.md
@.claude/rules/agents-catalog.md

## Key Commands
- `bun run dev` — Turbopack dev server
- `bun run build` — production build
- `bun test` — unit tests (Vitest)
- `bunx playwright test` — E2E tests
- `bun run db:migrate` — run Drizzle migrations
- `bun run lint` — ESLint + TypeScript check

## Stack Notes
- Default to React Server Components; use `"use client"` only when necessary
- Mutations go in `lib/actions/*.ts` (Server Actions), never in API routes
- Database schema in `drizzle/schema.ts` (single file), queries in `lib/db/queries.ts`
- UI primitives via `bunx shadcn add <component>` — never edit `components/ui/` manually
- Auth via NextAuth v5; protect routes in `middleware.ts`
```

- [ ] **Step 3: Create environment-isolation.md**

`templates/web/fullstack/nextjs-app-router/.claude/rules/environment-isolation.md`:
```markdown
# Environment & Isolation — Next.js App Router

## Gitignore
```
node_modules/
.next/
.env
.env.local
.claude/
```

## Package Manager: bun (mandatory)
- Install: `bun add <pkg>`
- Dev: `bun add -d <pkg>`
- Run: `bun run <script>`
- Test: `bun test`
Never use npm, yarn, or pnpm.

## Required Environment Variables
```
DATABASE_URL=          # PostgreSQL connection string
NEXTAUTH_SECRET=       # Random 32-char secret
NEXTAUTH_URL=          # e.g. http://localhost:3000
GOOGLE_CLIENT_ID=      # OAuth app
GOOGLE_CLIENT_SECRET=
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
```

---

### Remaining Web templates (follow the nextjs-app-router pattern above)

For each stack below, create the same three files. The MANIFEST.json is identical.
Only CLAUDE.md (role + stack notes + key commands) and environment-isolation.md vary.

- [ ] **Step 4: web/frontend/react-nextjs**

`templates/web/frontend/react-nextjs/CLAUDE.md` — Role: Frontend React Engineer
- Key commands: `bun run dev`, `bun test`, `bun run lint`, `bunx shadcn add`
- Stack notes: Vite or Next.js pages router, React 19, Tailwind CSS, no SSR mutations

`templates/web/frontend/react-nextjs/.claude/rules/environment-isolation.md`
- Package manager: bun
- Gitignore: `node_modules/`, `dist/`, `.env`

- [ ] **Step 5: web/frontend/vue-nuxt**

`templates/web/frontend/vue-nuxt/CLAUDE.md` — Role: Frontend Vue/Nuxt Engineer
- Key commands: `bun run dev`, `bun run build`, `bun test`
- Stack notes: Vue 3 Composition API, Nuxt 4 auto-imports, Pinia for state

`templates/web/frontend/vue-nuxt/.claude/rules/environment-isolation.md`
- Package manager: bun
- Gitignore: `node_modules/`, `.nuxt/`, `.output/`, `.env`

- [ ] **Step 6: web/frontend/svelte-sveltekit**

`templates/web/frontend/svelte-sveltekit/CLAUDE.md` — Role: Frontend Svelte Engineer
- Key commands: `bun run dev`, `bun run build`, `bun test`
- Stack notes: Svelte 5 runes, SvelteKit file-based routing, +server.ts for API

`templates/web/frontend/svelte-sveltekit/.claude/rules/environment-isolation.md`
- Package manager: bun
- Gitignore: `node_modules/`, `.svelte-kit/`, `build/`, `.env`

- [ ] **Step 7: web/fullstack/remix**

`templates/web/fullstack/remix/CLAUDE.md` — Role: Full-Stack Remix Engineer
- Key commands: `bun run dev`, `bun run build`, `bun test`
- Stack notes: Loader/Action model, nested routes, progressive enhancement first

`templates/web/fullstack/remix/.claude/rules/environment-isolation.md`
- Package manager: bun; Gitignore: `node_modules/`, `build/`, `.env`

- [ ] **Step 8: web/fullstack/t3-stack**

`templates/web/fullstack/t3-stack/CLAUDE.md` — Role: Full-Stack T3 Engineer
- Key commands: `bun run dev`, `bun run build`, `bun test`, `bun run db:push`
- Stack notes: tRPC for type-safe API, Prisma ORM, NextAuth, Tailwind

`templates/web/fullstack/t3-stack/.claude/rules/environment-isolation.md`
- Package manager: bun; env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`

- [ ] **Step 9: web/static-jamstack**

`templates/web/static-jamstack/CLAUDE.md` — Role: Jamstack Engineer
- Key commands: `bun run dev`, `bun run build`, `bun run preview`
- Stack notes: Astro or 11ty, content collections, no server-side state

`templates/web/static-jamstack/.claude/rules/environment-isolation.md`
- Package manager: bun; Gitignore: `node_modules/`, `dist/`, `.env`

- [ ] **Step 10: Commit all Web templates**

```bash
git add templates/web/
git commit -m "✨ feat(templates): add Web Development templates (6 stacks)"
```

---

## Task 10: Create Mobile and Backend templates

Follow the same three-file pattern (MANIFEST.json + CLAUDE.md + environment-isolation.md).

- [ ] **Step 1: mobile/react-native**

`CLAUDE.md` — Role: Mobile React Native Engineer
- Key commands: `bun run start`, `bun run ios`, `bun run android`, `bun test`
- Stack notes: Expo SDK, Expo Router for navigation, NativeWind for styling

`environment-isolation.md` — Package manager: bun; Gitignore: `node_modules/`, `.expo/`, `ios/`, `android/`

- [ ] **Step 2: mobile/flutter**

`CLAUDE.md` — Role: Mobile Flutter Engineer
- Key commands: `flutter run`, `flutter build apk`, `flutter test`
- Stack notes: Dart null safety, BLoC or Riverpod for state, go_router for navigation

`environment-isolation.md` — Package manager: `dart pub`; Gitignore: `.dart_tool/`, `build/`, `.env`

- [ ] **Step 3: mobile/native**

`CLAUDE.md` — Role: Native Mobile Engineer (iOS / Android)
- Key commands: Xcode build (iOS), `./gradlew build` (Android)
- Stack notes: SwiftUI (iOS) or Jetpack Compose (Android); platform-native patterns only

`environment-isolation.md` — Package managers: Swift Package Manager / Gradle; Gitignore: `.build/`, `DerivedData/`, `*.xcuserstate`

- [ ] **Step 4: backend/nodejs-bun**

`CLAUDE.md` — Role: Backend Node.js / Bun API Engineer
- Key commands: `bun run dev`, `bun run build`, `bun test`, `bun run lint`
- Stack notes: Hono for HTTP, Zod for validation, Drizzle ORM, structured Pino logging

`environment-isolation.md` — Package manager: bun; env vars: `PORT`, `DATABASE_URL`, `JWT_SECRET`

- [ ] **Step 5: backend/python/fastapi**

`CLAUDE.md` — Role: Backend Python API Engineer (FastAPI)
- Key commands: `uv run uvicorn main:app --reload`, `uv run pytest`, `uv run ruff check`
- Stack notes: FastAPI + Pydantic v2, SQLAlchemy 2.0 async, Alembic migrations, structlog

`environment-isolation.md` — Package manager: uv; env vars: `DATABASE_URL`, `SECRET_KEY`; Gitignore: `.venv/`, `__pycache__/`, `.env`

- [ ] **Step 6: backend/python/django**

`CLAUDE.md` — Role: Backend Django Engineer
- Key commands: `uv run manage.py runserver`, `uv run pytest`, `uv run manage.py migrate`
- Stack notes: Django 5 async views, DRF for APIs, Django ORM, pytest-django

`environment-isolation.md` — Package manager: uv; env vars: `DJANGO_SECRET_KEY`, `DATABASE_URL`; Gitignore: `.venv/`, `*.pyc`, `.env`

- [ ] **Step 7: backend/go**

`CLAUDE.md` — Role: Backend Go Engineer
- Key commands: `go run ./cmd/server`, `go test ./...`, `go build ./...`
- Stack notes: net/http or Gin, sqlx for queries, database/sql, structured slog logging

`environment-isolation.md` — Package manager: `go mod`; env vars: `DATABASE_URL`, `PORT`; Gitignore: `bin/`, `.env`

- [ ] **Step 8: backend/graphql**

`CLAUDE.md` — Role: GraphQL API Engineer
- Key commands: `bun run dev` or `uv run server`, `bun test` or `uv run pytest`
- Stack notes: Apollo Server (Node) or Strawberry (Python); DataLoader for N+1; schema-first design

`environment-isolation.md` — Package manager: bun or uv depending on runtime; Gitignore: `node_modules/` or `.venv/`, `.env`

- [ ] **Step 9: Commit Mobile + Backend templates**

```bash
git add templates/mobile/ templates/backend/
git commit -m "✨ feat(templates): add Mobile and Backend templates (8 stacks)"
```

---

## Task 11: Create Data Science, AI/ML, DevSecOps, and General templates

- [ ] **Step 1: data-science/python-notebooks**

`CLAUDE.md` — Role: Data Scientist / Analyst
- Key commands: `uv run jupyter lab`, `uv run pytest`, `uv run ruff check`
- Stack notes: pandas + polars for dataframes, matplotlib/seaborn/plotly for viz, modular notebooks via papermill

`environment-isolation.md` — Package manager: uv; Gitignore: `.venv/`, `__pycache__/`, `.ipynb_checkpoints/`, `.env`

- [ ] **Step 2: data-science/sql-analytics**

`CLAUDE.md` — Role: Analytics / BI Engineer
- Key commands: `uv run dbt run`, `uv run dbt test`, `uv run dbt docs generate`
- Stack notes: dbt for transformations, DuckDB or Snowflake, window functions preferred over subqueries

`environment-isolation.md` — Package manager: uv; env vars: `DBT_PROFILES_DIR`, `DATABASE_URL`; Gitignore: `.venv/`, `target/`, `.env`

- [ ] **Step 3: data-science/data-engineering**

`CLAUDE.md` — Role: Data Engineer
- Key commands: `uv run airflow standalone`, `uv run pytest`, `uv run dbt run`
- Stack notes: Airflow DAGs, Apache Spark via PySpark, dbt for transformations, OpenLineage for lineage

`environment-isolation.md` — Package manager: uv; env vars: `AIRFLOW_HOME`, `SPARK_HOME`, `DATABASE_URL`; Gitignore: `.venv/`, `logs/`, `.env`

- [ ] **Step 4: ai-ml/llm-agents**

`CLAUDE.md` — Role: AI Engineer / LLM Agent Builder
- Key commands: `uv run python main.py`, `uv run pytest`, `uv run ruff check`
- Stack notes: Pydantic AI or LangChain for agents, OpenAI/Anthropic SDK, structured outputs with Pydantic v2, prompt versioning

`environment-isolation.md` — Package manager: uv; env vars: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`; Gitignore: `.venv/`, `__pycache__/`, `.env`

- [ ] **Step 5: ai-ml/model-training**

`CLAUDE.md` — Role: ML Engineer
- Key commands: `uv run python train.py`, `uv run pytest`, `mlflow ui`
- Stack notes: PyTorch 2.x, MLflow for experiment tracking, Hugging Face datasets, reproducible seeds

`environment-isolation.md` — Package manager: uv; Gitignore: `.venv/`, `__pycache__/`, `mlruns/`, `checkpoints/`, `.env`

- [ ] **Step 6: ai-ml/computer-vision**

`CLAUDE.md` — Role: Computer Vision Engineer
- Key commands: `uv run python train.py`, `uv run pytest`
- Stack notes: OpenCV, Ultralytics YOLO or torchvision, ONNX for model export, albumentations for augmentation

`environment-isolation.md` — Package manager: uv; Gitignore: `.venv/`, `__pycache__/`, `weights/`, `runs/`, `.env`

- [ ] **Step 7: devsecops/cicd-pipelines**

`CLAUDE.md` — Role: DevOps / CI-CD Engineer
- Key commands: `gh workflow run`, `act` (local), `docker build`, `docker push`
- Stack notes: GitHub Actions, Docker multi-stage builds, secrets via environment variables never hardcoded, OIDC for cloud auth

`environment-isolation.md` — Package manager: none (script-based); Gitignore: `.env`, `*.tfstate`, `*.tfvars`

- [ ] **Step 8: devsecops/kubernetes-cloud**

`CLAUDE.md` — Role: Cloud Infrastructure / Kubernetes Engineer
- Key commands: `terraform plan`, `terraform apply`, `kubectl apply -f`, `helm upgrade --install`
- Stack notes: IaC-first (Terraform/OpenTofu), GitOps with ArgoCD or Flux, least-privilege IAM always

`environment-isolation.md` — Package manager: none (tfenv, asdf); Gitignore: `.terraform/`, `*.tfstate`, `*.tfvars`, `.env`

- [ ] **Step 9: devsecops/security-auditing**

`CLAUDE.md` — Role: Security Engineer
- Key commands: `uv run bandit -r src/`, `trivy image`, `semgrep --config=auto`
- Stack notes: OWASP Top 10 baseline for every review, secrets scanning pre-commit, SAST + SCA in CI

`environment-isolation.md` — Package manager: uv or bun; Gitignore: `.venv/`, `node_modules/`, `.env`

- [ ] **Step 10: general**

`templates/general/MANIFEST.json`:
```json
{
  "version": "1.0",
  "files": [
    "CLAUDE.md",
    ".claude/rules/environment-isolation.md"
  ]
}
```

`templates/general/CLAUDE.md`:
```markdown
# Role: Principal Software Engineer
You are an elite senior software engineer. Your goal is clean, optimal, production-ready code.
You prioritise maintainability, observability, and atomic architecture across any domain.

## Quick Reference
@.claude/rules/environment-isolation.md
@.claude/rules/testing-aaa.md
@.claude/rules/observability.md
@.claude/rules/git-workflow.md
@.claude/rules/project-organization.md
@.claude/rules/tool-selection.md
@.claude/rules/skills-catalog.md
@.claude/rules/agents-catalog.md

## Key Commands
- JS/TS: `bun run dev` · `bun test` · `bun run lint`
- Python: `uv run python main.py` · `uv run pytest` · `uv run ruff check`

## Stack Notes
- Use **bun** for JS/TS projects, **uv** for Python — no exceptions
- Validate environment variables at startup; fail fast with a clear message
- Structured JSON logs only — no console.log or print() in production
```

`templates/general/.claude/rules/environment-isolation.md`:
```markdown
# Environment & Isolation — General Purpose

## Gitignore
```
node_modules/
.venv/
dist/
build/
.env
.claude/
```

## Package Managers
- JS/TS: **bun** — `bun add`, `bun run`, `bun test`
- Python: **uv** — `uv add`, `uv run`, `uv venv`

## Environment Variables
- `.env` — local dev only, never committed
- `.env.example` — committed template
- Validate at startup; crash with clear error if required vars are missing

## Worktrees
Every feature lives in an isolated worktree. Merge back to main only when tests pass.
```

- [ ] **Step 11: Commit all remaining templates**

```bash
git add templates/data-science/ templates/ai-ml/ templates/devsecops/ templates/general/
git commit -m "✨ feat(templates): add Data Science, AI/ML, DevSecOps, and General templates"
```

---

## Task 12: Full verification

- [ ] **Step 1: Run full test suite**

```bash
bun test
```

Expected output: all test files pass with 0 failures.
Approximate count: navigation (4) + resolve (4) + scaffold (6) + fetch (8) + prompt (5) + install (7) + cli (5) + gitignore (5) = **44 tests total**.

- [ ] **Step 2: Smoke test CI mode**

```bash
cd $(mktemp -d)
node /path/to/init-claude-swe/bin/index.js --category web --type fullstack --stack nextjs-app-router --scope project --yes
```

Expected:
- `CLAUDE.md` created in the temp directory
- `.claude/settings.json` created
- `.claude/rules/` directory with 8 files
- No `.gitignore` entry (project scope)

- [ ] **Step 3: Smoke test local scope**

```bash
cd $(mktemp -d)
node /path/to/init-claude-swe/bin/index.js --category general --scope local --yes
```

Expected:
- `CLAUDE.local.md` created (not `CLAUDE.md`)
- `.gitignore` contains `CLAUDE.local.md`

- [ ] **Step 4: Final commit + push**

```bash
git push
```

---

## Self-Review Notes

- **Spec coverage:** All 5 design sections covered. Navigation tree (§2), fetch pipeline (§3), module map (§4), template content strategy (§5), elegant clack UI (§2) all have corresponding tasks.
- **Placeholder scan:** All code blocks are complete. Template content steps provide actual file content for representative stacks and clear patterns for the remainder.
- **Type consistency:** `install()` returns `{ filename, stackLabel, scope, filesWritten }` — used consistently in cli.js outro and install.test.js assertions. `fetchFiles` → `Map<string,string>` passed to `writeAll` — consistent throughout. `mergeManifests` takes `string[]` from `fetchManifest` — consistent.
- **Breaking change note:** `src/templates.js` is deleted and `SCOPE_FILENAME` export from old `install.js` is removed. `test/install.test.js` is fully replaced. Old `--template` flag is removed from `cli.js`.
