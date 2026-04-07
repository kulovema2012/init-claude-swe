'use strict';

const fs = require('fs');
const path = require('path');
const { fetchFile, TIMEOUT_MS } = require('../utils/fetch');
const { ensureGitignoreEntry } = require('../utils/gitignore');
const { promptScope, promptTemplate, promptOverwrite } = require('../utils/prompt');
const { TEMPLATES } = require('../templates');

const SCOPE_FILENAME = {
  project: 'CLAUDE.md',
  local: 'CLAUDE.local.md',
};

/**
 * Core install logic.
 * @param {object} opts
 * @param {string} opts.scope - "project" or "local" (null = prompt or default)
 * @param {string} opts.templateName - template key (null = prompt or default)
 * @param {string} opts.cwd - working directory
 * @param {boolean} opts.isTTY - whether stdin is a TTY
 * @param {boolean} [opts.overwrite] - force overwrite (skip prompt)
 * @param {object} [opts.fetchTransport] - injectable transport for testing
 * @param {number} [opts.fetchPort] - port for test server
 * @returns {Promise<{ filename: string, templateName: string, scope: string }>}
 */
async function install(opts) {
  const cwd = opts.cwd || process.cwd();
  const isTTY = opts.isTTY !== undefined ? opts.isTTY : !!process.stdin.isTTY;

  // Resolve scope — prompt if TTY and no scope provided, else default to project
  let scope = opts.scope;
  if (scope && SCOPE_FILENAME[scope]) {
    // Valid scope provided via flag — use it
  } else if (isTTY) {
    scope = await promptScope();
  } else {
    scope = 'project';
  }

  // Resolve template
  let templateName = opts.templateName;
  if (templateName === 'interactive') {
    templateName = isTTY ? await promptTemplate() : 'default';
  } else if (!templateName || !TEMPLATES[templateName]) {
    templateName = 'default';
  }

  const filename = SCOPE_FILENAME[scope];
  const dest = path.join(cwd, filename);

  // Check destination
  if (fs.existsSync(dest)) {
    const stat = fs.statSync(dest);
    if (stat.isDirectory()) {
      throw new Error(`${filename} is a directory. Aborting.`);
    }

    if (opts.overwrite) {
      // skip prompt
    } else if (!isTTY) {
      throw new Error(`${filename} already exists. Use --overwrite or run in interactive mode.`);
    } else {
      const overwrite = await promptOverwrite();
      if (!overwrite) {
        throw new Error('Aborted.');
      }
    }
  }

  // Fetch template
  let url = TEMPLATES[templateName];
  if (opts.fetchTransport && opts.fetchPort) {
    // Rewrite URL to local test server
    url = `http://127.0.0.1:${opts.fetchPort}/${templateName}`;
  }

  let content;
  try {
    content = await fetchFile(url, TIMEOUT_MS, opts.fetchTransport);
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      throw new Error('Request timed out. Check your internet connection.');
    } else if (err.message.startsWith('HTTP ')) {
      throw new Error(`Failed to fetch template. ${err.message}`);
    } else if (err.message === 'EMPTY') {
      throw new Error('Fetched template is empty. Aborting.');
    } else {
      throw new Error('Failed to fetch template. Check your internet connection.');
    }
  }

  // Write file
  fs.writeFileSync(dest, content, 'utf8');

  // Handle .gitignore for local scope
  if (scope === 'local') {
    ensureGitignoreEntry(cwd, filename);
  }

  return { filename, templateName, scope };
}

module.exports = { install, SCOPE_FILENAME };
