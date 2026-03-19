'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RAW_URL =
  'https://raw.githubusercontent.com/kulovema2012/init-claude-swe/main/CLAUDE.md';
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

    // Use global setTimeout (reliable cross-platform) instead of req.setTimeout
    timer = setTimeout(() => {
      req.destroy();
      settle(reject, new Error('TIMEOUT'));
    }, timeoutMs);

    req.on('error', (err) => {
      settle(reject, err);
    });
  });
}

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
