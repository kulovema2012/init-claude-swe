# init-claude-swe Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish `init-claude-swe`, a zero-dependency Node.js CLI that fetches `CLAUDE.md` from GitHub and writes it to the user's current directory.

**Architecture:** A thin `bin/index.js` entry point calls `run()` exported from `src/cli.js`. All logic lives in `src/cli.js` as pure, exported functions to enable unit testing. The `https` transport is injected as an optional parameter in `fetchFile` for testability without network coupling.

**Tech Stack:** Node.js 18+ (CommonJS), bun (dev runner/test), npm (publish only)

---

## File Map

| File | Responsibility |
|---|---|
| `package.json` | Package metadata, bin entry, engines, files, scripts |
| `.gitignore` | Exclude `node_modules/` |
| `bin/index.js` | Shebang + `require('../src/cli').run()` — no logic |
| `src/cli.js` | Exports: `checkDestination`, `fetchFile`, `promptOverwrite`, `writeFile`, `run` |
| `test/cli.test.js` | Unit tests for `checkDestination`, `fetchFile`, `writeFile` |

---

## Chunk 1: Project Scaffold

### Task 1: Create `package.json`

**Files:**
- Create: `package.json`

- [ ] **Step 1: Write `package.json`**

> **Note:** The spec lists `"files": ["bin/"]`, but since logic lives in `src/cli.js` (required by `bin/index.js` at runtime), `src/` must also be published. This is an intentional deviation — without it the package fails at runtime.

```json
{
  "name": "init-claude-swe",
  "version": "1.0.0",
  "description": "npx CLI that fetches and installs CLAUDE.md into any project",
  "license": "MIT",
  "type": "commonjs",
  "engines": { "node": ">=18" },
  "bin": { "init-claude-swe": "./bin/index.js" },
  "files": ["bin/", "src/"],
  "scripts": {
    "test": "bun test"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/kulovema2012/init-claude-swe.git"
  },
  "keywords": ["claude", "ai", "boilerplate", "setup", "swe"]
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 3: Create directory structure**

```bash
mkdir -p bin src test
```

- [ ] **Step 4: Commit**

```bash
git add package.json .gitignore
git commit -m "chore: scaffold package.json and .gitignore"
git push
```

---

## Chunk 2: Core Logic (TDD)

### Task 2: `checkDestination` — write test first

**Files:**
- Create: `test/cli.test.js`
- Create: `src/cli.js`

- [ ] **Step 1: Write the failing test for `checkDestination`**

Create `test/cli.test.js`:

```js
'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkDestination } = require('../src/cli');

describe('checkDestination', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-claude-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('returns exists:false when path does not exist', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    // Act
    const result = checkDestination(target);
    // Assert
    expect(result).toEqual({ exists: false, isDir: false });
  });

  test('returns exists:true, isDir:false for a regular file', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(target, 'content');
    // Act
    const result = checkDestination(target);
    // Assert
    expect(result).toEqual({ exists: true, isDir: false });
  });

  test('returns exists:true, isDir:true when path is a directory', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    fs.mkdirSync(target);
    // Act
    const result = checkDestination(target);
    // Assert
    expect(result).toEqual({ exists: true, isDir: true });
  });
});
```

- [ ] **Step 2: Run test — expect failure (module not found)**

```bash
bun test
```

Expected output: error `Cannot find module '../src/cli'`

- [ ] **Step 3: Implement `checkDestination` in `src/cli.js`**

Create `src/cli.js`:

```js
'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RAW_URL =
  'https://raw.githubusercontent.com/kulovema2012/init-claude-swe/master/CLAUDE.md';
const TIMEOUT_MS = 10000;

/**
 * @param {string} destPath
 * @returns {{ exists: boolean, isDir: boolean }}
 */
function checkDestination(destPath) {
  if (!fs.existsSync(destPath)) return { exists: false, isDir: false };
  const stat = fs.statSync(destPath);
  return { exists: true, isDir: stat.isDirectory() };
}

module.exports = { checkDestination };
```

- [ ] **Step 4: Run test — expect pass**

```bash
bun test
```

Expected: 3 passing tests for `checkDestination`

- [ ] **Step 5: Commit**

```bash
git add src/cli.js test/cli.test.js
git commit -m "feat(cli): add checkDestination with TDD"
git push
```

---

### Task 3: `writeFile` — TDD

**Files:**
- Modify: `test/cli.test.js` (append)
- Modify: `src/cli.js` (append)

- [ ] **Step 1: Append failing tests for `writeFile` to `test/cli.test.js`**

```js
const { checkDestination, writeFile } = require('../src/cli');

// ... (add after the checkDestination describe block)

describe('writeFile', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-claude-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('writes content to the given path', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    // Act
    writeFile(target, '# Hello');
    // Assert
    expect(fs.readFileSync(target, 'utf8')).toBe('# Hello');
  });

  test('overwrites an existing file', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(target, 'old content');
    // Act
    writeFile(target, 'new content');
    // Assert
    expect(fs.readFileSync(target, 'utf8')).toBe('new content');
  });
});
```

Update the require at the top of the test file:

```js
const { checkDestination, writeFile } = require('../src/cli');
```

- [ ] **Step 2: Run test — expect `writeFile` to fail**

```bash
bun test
```

Expected: `writeFile is not a function`

- [ ] **Step 3: Implement `writeFile` in `src/cli.js`**

Add after `checkDestination`:

```js
/**
 * @param {string} destPath
 * @param {string} content
 */
function writeFile(destPath, content) {
  fs.writeFileSync(destPath, content, 'utf8');
}
```

Update `module.exports`:

```js
module.exports = { checkDestination, writeFile };
```

- [ ] **Step 4: Run test — expect all pass**

```bash
bun test
```

Expected: 5 passing tests

- [ ] **Step 5: Commit**

```bash
git add src/cli.js test/cli.test.js
git commit -m "feat(cli): add writeFile with TDD"
git push
```

---

### Task 4: `fetchFile` — TDD with injected transport

**Files:**
- Modify: `test/cli.test.js` (append)
- Modify: `src/cli.js` (append)

- [ ] **Step 1: Append failing tests for `fetchFile`**

```js
const { checkDestination, writeFile, fetchFile } = require('../src/cli');

// ... (add after the writeFile describe block)

describe('fetchFile', () => {
  let server;
  let port;

  beforeEach(async () => {
    // Spin up a local HTTP server to simulate GitHub responses
    server = http.createServer((req, res) => {
      if (req.url === '/ok') {
        res.writeHead(200);
        res.end('# CLAUDE content');
      } else if (req.url === '/404') {
        res.writeHead(404);
        res.end('Not Found');
      } else if (req.url === '/empty') {
        res.writeHead(200);
        res.end('');
      } else if (req.url === '/slow') {
        // Never responds — triggers timeout
      }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('resolves with file content on 200 response', async () => {
    // Arrange
    const url = `http://127.0.0.1:${port}/ok`;
    // Act
    const result = await fetchFile(url, 5000, http);
    // Assert
    expect(result).toBe('# CLAUDE content');
  });

  test('rejects with HTTP error message on non-200 response', async () => {
    // Arrange
    const url = `http://127.0.0.1:${port}/404`;
    // Act
    const promise = fetchFile(url, 5000, http);
    // Assert
    await expect(promise).rejects.toThrow('HTTP 404');
  });

  test('rejects with EMPTY on empty response body', async () => {
    // Arrange
    const url = `http://127.0.0.1:${port}/empty`;
    // Act
    const promise = fetchFile(url, 5000, http);
    // Assert
    await expect(promise).rejects.toThrow('EMPTY');
  });

  test('rejects with TIMEOUT when request exceeds timeout', async () => {
    // Arrange
    const url = `http://127.0.0.1:${port}/slow`;
    // Act
    const promise = fetchFile(url, 100, http);
    // Assert
    await expect(promise).rejects.toThrow('TIMEOUT');
  });
});
```

Update the require at the top of the test file:

```js
const http = require('http');
const { checkDestination, writeFile, fetchFile } = require('../src/cli');
```

- [ ] **Step 2: Run test — expect `fetchFile` to fail**

```bash
bun test
```

Expected: `fetchFile is not a function`

- [ ] **Step 3: Implement `fetchFile` in `src/cli.js`**

Add after `writeFile`:

```js
/**
 * @param {string} url
 * @param {number} timeoutMs
 * @param {object} [transport] - injectable for testing (defaults to https)
 * @returns {Promise<string>}
 */
function fetchFile(url, timeoutMs, transport) {
  const protocol = transport || (url.startsWith('https') ? https : http);
  return new Promise((resolve, reject) => {
    const req = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (!data.trim()) {
          reject(new Error('EMPTY'));
          return;
        }
        resolve(data);
      });
    });
    let timedOut = false;
    req.setTimeout(timeoutMs, () => {
      timedOut = true;
      req.destroy();
    });
    req.on('error', (err) => {
      if (timedOut) reject(new Error('TIMEOUT'));
      else reject(err);
    });
  });
}
```

Update `module.exports`:

```js
module.exports = { checkDestination, writeFile, fetchFile };
```

- [ ] **Step 4: Run test — expect all 9 pass**

```bash
bun test
```

Expected: 9 passing tests

- [ ] **Step 5: Commit**

```bash
git add src/cli.js test/cli.test.js
git commit -m "feat(cli): add fetchFile with TDD (transport injection, local HTTP server)"
git push
```

---

### Task 5: `run()` — wire everything together

**Files:**
- Modify: `src/cli.js` (append)

No unit tests for `run()` — it orchestrates I/O and side effects. It will be verified via smoke test in Task 7.

- [ ] **Step 1: Append `promptOverwrite` and `run` to `src/cli.js`**

```js
/**
 * Prompts the user in a TTY environment.
 * @returns {Promise<boolean>} true if user confirms overwrite
 */
function promptOverwrite() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('CLAUDE.md already exists. Overwrite? (y/N) ', (answer) => {
      rl.close();
      resolve(answer === 'y' || answer === 'Y');
    });
  });
}

async function run() {
  const dest = path.join(process.cwd(), 'CLAUDE.md');
  const { exists, isDir } = checkDestination(dest);

  if (isDir) {
    process.stderr.write('CLAUDE.md is a directory. Aborting.\n');
    process.exit(1);
  }

  if (exists) {
    if (!process.stdin.isTTY) {
      process.stderr.write('Non-interactive environment. Aborting.\n');
      process.exit(0);
    }
    const overwrite = await promptOverwrite();
    if (!overwrite) {
      process.stdout.write('Aborted.\n');
      process.exit(0);
    }
  }

  let content;
  try {
    content = await fetchFile(RAW_URL, TIMEOUT_MS);
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      process.stderr.write('Request timed out. Check your internet connection.\n');
    } else if (err.message.startsWith('HTTP ')) {
      process.stderr.write(`Failed to fetch CLAUDE.md. ${err.message}\n`);
    } else if (err.message === 'EMPTY') {
      process.stderr.write('Fetched CLAUDE.md is empty. Aborting.\n');
    } else {
      process.stderr.write('Failed to fetch CLAUDE.md. Check your internet connection.\n');
    }
    process.exit(1);
  }

  try {
    writeFile(dest, content);
  } catch (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  }

  process.stdout.write('✓ CLAUDE.md added to your project.\n');
}

module.exports = { checkDestination, writeFile, fetchFile, run };
```

- [ ] **Step 2: Run tests — confirm still passing**

```bash
bun test
```

Expected: 9 passing

- [ ] **Step 3: Commit**

```bash
git add src/cli.js
git commit -m "feat(cli): add promptOverwrite and run() orchestration"
git push
```

---

## Chunk 3: CLI Entry Point & Smoke Test

### Task 6: Create `bin/index.js`

**Files:**
- Create: `bin/index.js`

- [ ] **Step 1: Write `bin/index.js`**

```js
#!/usr/bin/env node
'use strict';

const { run } = require('../src/cli');
run().catch((err) => {
  process.stderr.write((err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
});
```

- [ ] **Step 2: Make the file executable (Unix)**

```bash
chmod +x bin/index.js
```

- [ ] **Step 3: Commit**

```bash
git add bin/index.js
git commit -m "feat(bin): add CLI entry point"
git push
```

---

### Task 7: Smoke test locally

**Files:** none

- [ ] **Step 1: Link package locally**

```bash
npm link
```

- [ ] **Step 2: Run in a temp directory (no existing CLAUDE.md)**

```bash
cd /tmp && mkdir smoke-test && cd smoke-test
init-claude-swe
```

Expected output:
```
✓ CLAUDE.md added to your project.
```

Verify the file exists and is non-empty:
```bash
cat CLAUDE.md | head -5
```

- [ ] **Step 3: Run again in the same directory (file already exists)**

```bash
init-claude-swe
```

Expected: `CLAUDE.md already exists. Overwrite? (y/N)`

Type `N` — expected: `Aborted.`

Run again, type `y` — expected: `✓ CLAUDE.md added to your project.`

- [ ] **Step 4: Unlink after testing**

```bash
npm unlink -g init-claude-swe
```

---

## Chunk 4: Publish to npm

### Task 8: Dry-run and publish

**Files:** none

- [ ] **Step 1: Verify npm login**

```bash
npm whoami
```

Expected: your npm username

- [ ] **Step 2: Dry-run publish — inspect what gets included**

```bash
npm publish --dry-run
```

Verify the output lists only:
- `bin/index.js`
- `src/cli.js`
- `package.json`

If `node_modules/`, `test/`, or `docs/` appear in the list, the `"files"` field in `package.json` needs to be tightened.

- [ ] **Step 3: Publish**

```bash
npm publish --access public
```

Expected: `+ init-claude-swe@1.0.0`

- [ ] **Step 4: Verify on npm**

```bash
npm info init-claude-swe
```

Expected: shows package metadata with correct version and description.

- [ ] **Step 5: Live end-to-end test with npx**

```bash
cd /tmp && mkdir npx-test && cd npx-test
npx init-claude-swe
```

Expected: `✓ CLAUDE.md added to your project.`

- [ ] **Step 6: Tag the publish**

```bash
git tag v1.0.0
git push --tags
```
