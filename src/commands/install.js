'use strict';

const fs = require('fs');
const path = require('path');
const { fetchManifest, fetchFiles } = require('../utils/fetch');
const { ensureGitignoreEntry } = require('../utils/gitignore');
const { promptSelections, promptOverwrite } = require('../utils/prompt');
const { buildPaths } = require('../utils/resolve');
const { mergeManifests, writeAll } = require('../utils/scaffold');

/**
 * Core install logic — orchestrates the full scaffold pipeline.
 * @param {object} opts
 * @param {string} [opts.category]       CI flag: category slug
 * @param {string} [opts.type]           CI flag: type slug
 * @param {string} [opts.stack]          CI flag: stack slug
 * @param {string} [opts.scope]          CI flag: 'project' | 'local'
 * @param {boolean} [opts.yes]           skip overwrite prompt
 * @param {boolean} [opts.overwrite]     force overwrite (testing)
 * @param {string} opts.cwd              working directory
 * @param {boolean} opts.isTTY           whether stdin is a TTY
 * @param {object} [opts.fetchTransport] injectable transport for testing
 * @param {string} [opts.baseUrl]        override base URL (testing)
 * @param {string} [opts.leafUrl]        override leaf URL (testing)
 * @param {function} [opts.onProgress]   progress callback ({ done, total, filePath })
 * @param {{ slugs: string[], scope: string }} [opts.simulate]  inject prompt answers (testing)
 * @returns {Promise<{ filename: string, stackLabel: string, scope: string, filesWritten: string[] }>}
 */
async function install(opts) {
  const cwd = opts.cwd || process.cwd();
  const isTTY = opts.isTTY !== undefined ? opts.isTTY : !!process.stdin.isTTY;

  // 1. Resolve selections (simulate > CI flags > interactive prompt)
  let slugs, scope;
  if (opts.simulate !== undefined) {
    ({ slugs, scope } = opts.simulate);
  } else if (opts.category && opts.scope) {
    slugs = [opts.category, opts.type, opts.stack].filter(Boolean);
    scope = opts.scope;
  } else if (isTTY) {
    ({ slugs, scope } = await promptSelections());
  } else {
    throw new Error(
      'Non-interactive mode requires --category and --scope flags.'
    );
  }

  // 2. Build GitHub URLs (override allowed for testing)
  const { baseUrl, leafUrl } =
    opts.baseUrl
      ? { baseUrl: opts.baseUrl, leafUrl: opts.leafUrl }
      : buildPaths(slugs);

  // 3. Fetch manifests (abort on failure — no partial writes)
  let baseFiles, leafFiles;
  try {
    [baseFiles, leafFiles] = await Promise.all([
      fetchManifest(baseUrl, opts.fetchTransport),
      fetchManifest(leafUrl, opts.fetchTransport),
    ]);
  } catch (err) {
    throw new Error(`Failed to fetch manifest: ${err.message}`);
  }

  // 4. Merge into URL map (leaf overrides base on same path)
  const urlMap = mergeManifests(baseFiles, leafFiles, baseUrl, leafUrl);

  // 5. Check for existing destination file
  const destFile = scope === 'local' ? 'CLAUDE.local.md' : 'CLAUDE.md';
  const destPath = path.join(cwd, destFile);
  if (fs.existsSync(destPath)) {
    if (opts.overwrite || opts.yes) {
      // skip prompt
    } else if (!isTTY) {
      throw new Error(
        `${destFile} already exists. Use --yes or run in interactive mode.`
      );
    } else {
      const overwrite = await promptOverwrite();
      if (!overwrite) throw new Error('Aborted.');
    }
  }

  // 6. Fetch all files in parallel
  const contentMap = await fetchFiles(urlMap, opts.fetchTransport, opts.onProgress);

  // 7. Write to disk atomically
  writeAll(contentMap, cwd, scope);

  // 8. Gitignore for local scope only
  if (scope === 'local') {
    ensureGitignoreEntry(cwd, 'CLAUDE.local.md');
  }

  const stackLabel = slugs[slugs.length - 1] || 'general';
  return { filename: destFile, stackLabel, scope, filesWritten: [...contentMap.keys()] };
}

module.exports = { install };
