'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { install } = require('../src/commands/install');

describe('install', () => {
  let tmpDir;
  let server;
  let port;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-claude-install-'));

    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('# Template content for ' + req.url);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterEach(async () => {
    fs.rmSync(tmpDir, { recursive: true });
    await new Promise((resolve) => server.close(resolve));
  });

  test('writes CLAUDE.md for project scope', async () => {
    // Arrange
    const templateName = 'default';
    // Act
    await install({
      scope: 'project',
      templateName,
      cwd: tmpDir,
      isTTY: false,
      fetchTransport: http,
      fetchPort: port,
    });
    // Assert
    const dest = path.join(tmpDir, 'CLAUDE.md');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf8')).toContain('Template content');
  });

  test('writes CLAUDE.md for local scope', async () => {
    // Arrange
    const templateName = 'default';
    // Act
    await install({
      scope: 'local',
      templateName,
      cwd: tmpDir,
      isTTY: false,
      fetchTransport: http,
      fetchPort: port,
    });
    // Assert
    const dest = path.join(tmpDir, 'CLAUDE.md');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf8')).toContain('Template content');
  });

  test('adds CLAUDE.md to .gitignore for local scope', async () => {
    // Arrange
    const templateName = 'default';
    // Act
    await install({
      scope: 'local',
      templateName,
      cwd: tmpDir,
      isTTY: false,
      fetchTransport: http,
      fetchPort: port,
    });
    // Assert
    const gitignore = path.join(tmpDir, '.gitignore');
    expect(fs.existsSync(gitignore)).toBe(true);
    expect(fs.readFileSync(gitignore, 'utf8')).toContain('CLAUDE.md');
  });

  test('does not touch .gitignore for project scope', async () => {
    // Arrange
    const templateName = 'default';
    // Act
    await install({
      scope: 'project',
      templateName,
      cwd: tmpDir,
      isTTY: false,
      fetchTransport: http,
      fetchPort: port,
    });
    // Assert
    const gitignore = path.join(tmpDir, '.gitignore');
    expect(fs.existsSync(gitignore)).toBe(false);
  });

  test('throws when file exists in non-interactive mode', async () => {
    // Arrange
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'old');
    // Act & Assert
    await expect(
      install({
        scope: 'project',
        templateName: 'default',
        cwd: tmpDir,
        isTTY: false,
        fetchTransport: http,
        fetchPort: port,
      })
    ).rejects.toThrow('already exists');
  });

  test('overwrites when overwrite=true', async () => {
    // Arrange
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'old');
    // Act
    await install({
      scope: 'project',
      templateName: 'default',
      cwd: tmpDir,
      isTTY: false,
      overwrite: true,
      fetchTransport: http,
      fetchPort: port,
    });
    // Assert
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    expect(content).toContain('Template content');
  });
});
