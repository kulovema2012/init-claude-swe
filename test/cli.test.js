'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { checkDestination, writeFile, fetchFile } = require('../src/cli');

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
