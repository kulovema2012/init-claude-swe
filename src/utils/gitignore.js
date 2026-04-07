'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Ensures an entry exists in the .gitignore file in the given directory.
 * Creates .gitignore if it doesn't exist. Appends the entry if missing.
 * @param {string} dir - Directory containing (or to contain) .gitignore
 * @param {string} entry - The gitignore entry to ensure exists
 */
function ensureGitignoreEntry(dir, entry) {
  const gitignorePath = path.join(dir, '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, entry + '\n', 'utf8');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n');

  if (lines.includes(entry)) {
    return;
  }

  const updated = (content.endsWith('\n') ? content : content + '\n') + entry + '\n';
  fs.writeFileSync(gitignorePath, updated, 'utf8');
}

module.exports = { ensureGitignoreEntry };