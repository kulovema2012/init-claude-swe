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

/**
 * @param {string} destPath
 * @param {string} content
 */
function writeFile(destPath, content) {
  fs.writeFileSync(destPath, content, 'utf8');
}

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
    const settle = (fn, val) => {
      if (!settled) { settled = true; fn(val); }
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

    let timedOut = false;
    req.setTimeout(timeoutMs, () => {
      timedOut = true;
      req.destroy();
      // Reject immediately on timeout — don't wait for error event
      settle(reject, new Error('TIMEOUT'));
    });

    req.on('error', (err) => {
      // settled guard prevents double-rejection if timeout already fired
      settle(reject, err);
    });
  });
}

module.exports = { checkDestination, writeFile, fetchFile };
