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
    expect(result.stackLabel).toBe('nextjs-app-router');
    expect(result.scope).toBe('project');
    expect(Array.isArray(result.filesWritten)).toBe(true);
    expect(result.filesWritten.length).toBeGreaterThan(0);
  });

  test('throws in non-interactive mode without category and scope flags', async () => {
    // Arrange
    const opts = { cwd: tmpDir, isTTY: false };
    // Act & Assert
    await expect(install(opts)).rejects.toThrow('Non-interactive mode requires');
  });
});
