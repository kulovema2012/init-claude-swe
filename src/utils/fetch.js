'use strict';

const https = require('https');
const http = require('http');

const TIMEOUT_MS = 10000;

/**
 * @param {string} url
 * @param {number} timeoutMs
 * @param {object} [transport] - injectable for testing (defaults to https)
 * @returns {Promise<string>}
 */
function fetchFile(url, timeoutMs, transport) {
  const protocol = transport || (url.startsWith('https') ? https : http);
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;
    const settle = (fn, val) => {
      if (!settled) {
        settled = true;
        if (timer) clearTimeout(timer);
        fn(val);
      }
    };

    const req = protocol.get(url, (res) => {
      if (res.statusCode !== 200) {
        settle(reject, new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (!data.trim()) {
          settle(reject, new Error('EMPTY'));
          return;
        }
        settle(resolve, data);
      });
    });

    timer = setTimeout(() => {
      if (!settled) {
        req.destroy();
        settle(reject, new Error('TIMEOUT'));
      }
    }, timeoutMs);

    req.on('error', (err) => {
      settle(reject, err);
    });
  });
}

/**
 * Fetch and parse a MANIFEST.json file, returning its files array.
 * @param {string} dirUrl - directory URL (no trailing slash)
 * @param {object} [transport]
 * @returns {Promise<string[]>}
 */
async function fetchManifest(dirUrl, transport) {
  const content = await fetchFile(`${dirUrl}/MANIFEST.json`, TIMEOUT_MS, transport);
  return JSON.parse(content).files;
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
  const contentMap = new Map();

  await Promise.all(
    entries.map(async ([filePath, url]) => {
      let content;
      try {
        content = await fetchFile(url, TIMEOUT_MS, transport);
      } catch (firstErr) {
        try {
          content = await fetchFile(url, TIMEOUT_MS, transport);
        } catch (retryErr) {
          throw new Error(`Failed to fetch ${filePath} after retry. First: ${firstErr.message}. Retry: ${retryErr.message}`);
        }
      }
      contentMap.set(filePath, content);
      if (onProgress) onProgress({ done: contentMap.size, total, filePath });
    })
  );

  return contentMap;
}

module.exports = { fetchFile, fetchManifest, fetchFiles, TIMEOUT_MS };