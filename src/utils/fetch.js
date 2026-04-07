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
      req.destroy();
      settle(reject, new Error('TIMEOUT'));
    }, timeoutMs);

    req.on('error', (err) => {
      settle(reject, err);
    });
  });
}

module.exports = { fetchFile, TIMEOUT_MS };