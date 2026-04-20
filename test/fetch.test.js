'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const http = require('http');
const { fetchFile } = require('../src/utils/fetch');
const { fetchManifest, fetchFiles } = require('../src/utils/fetch');

describe('fetchFile', () => {
  let server;
  let port;

  beforeEach(async () => {
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