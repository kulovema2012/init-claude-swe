'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const http = require('http');
const { fetchFile } = require('../src/utils/fetch');

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