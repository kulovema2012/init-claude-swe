'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Merge base and leaf file lists into a fetch URL map.
 * Leaf entries override base entries with the same relative path.
 * @param {string[]} baseFiles - relative paths from base MANIFEST
 * @param {string[]} leafFiles - relative paths from leaf MANIFEST
 * @param {string} baseUrl - raw GitHub URL of _base/ directory
 * @param {string} leafUrl - raw GitHub URL of leaf directory
 * @returns {Map<string, string>} Map<relativePath, fetchUrl>
 */
function mergeManifests(baseFiles, leafFiles, baseUrl, leafUrl) {
  const base = baseUrl.replace(/\/$/, '');
  const leaf = leafUrl.replace(/\/$/, '');
  const map = new Map();
  for (const f of baseFiles) {
    map.set(f, `${base}/${f}`);
  }
  for (const f of leafFiles) {
    map.set(f, `${leaf}/${f}`);
  }
  return map;
}

/**
 * Write fetched file contents to disk, creating subdirectories as needed.
 * For local scope, renames CLAUDE.md → CLAUDE.local.md.
 * @param {Map<string, string>} contentMap - Map<relativePath, fileContent>
 * @param {string} cwd - target directory
 * @param {string} scope - 'project' | 'local'
 */
function writeAll(contentMap, cwd, scope) {
  const VALID_SCOPES = new Set(['project', 'local']);
  if (!VALID_SCOPES.has(scope)) {
    throw new Error(`writeAll: unknown scope "${scope}". Expected "project" or "local".`);
  }
  for (const [filePath, content] of contentMap) {
    const destPath =
      scope === 'local' && filePath === 'CLAUDE.md' ? 'CLAUDE.local.md' : filePath;
    const fullPath = path.join(cwd, destPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }
}

module.exports = { mergeManifests, writeAll };
