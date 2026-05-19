'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { checkAndInstallBinaries } = require('../utils/env-check');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const TEMPLATES_DIR = path.join(__dirname, '../../templates/global');

// Static files relative to templates/global → installed relative to ~/.claude/
const STATIC_FILES = [
  'hooks/warp-autoswitch.mjs',
  'hooks/context-mode-cache-heal.mjs',
  'hooks/apply-skill-overrides.mjs',
  'hooks/gitnexus/gitnexus-hook.cjs',
  'statusline.js',
];

/**
 * Build the hook entries that wire up the installed scripts.
 * All paths are computed at runtime from the current user's home dir.
 */
function buildHookEntries(claudeHome = CLAUDE_HOME) {
  const h = claudeHome.replace(/\\/g, '/');
  return {
    SessionStart: [
      {
        hooks: [{ type: 'command', command: `node "${h}/hooks/warp-autoswitch.mjs"` }],
      },
      {
        hooks: [{ type: 'command', command: `node "${h}/hooks/context-mode-cache-heal.mjs"` }],
      },
      {
        hooks: [{
          type: 'command',
          command: `node "${h}/hooks/apply-skill-overrides.mjs"`,
          statusMessage: 'Applying skill overrides...',
        }],
      },
    ],
    PreToolUse: [
      {
        matcher: 'Grep|Glob|Bash',
        hooks: [{
          type: 'command',
          command: `node "${h}/hooks/gitnexus/gitnexus-hook.cjs"`,
          timeout: 10,
          statusMessage: 'Enriching with GitNexus graph context...',
        }],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Bash',
        hooks: [{
          type: 'command',
          command: `node "${h}/hooks/gitnexus/gitnexus-hook.cjs"`,
          timeout: 10,
          statusMessage: 'Checking GitNexus index freshness...',
        }],
      },
    ],
  };
}

/**
 * Merge hook event arrays without duplicating existing entries.
 * An entry is considered a duplicate if all its command strings already exist
 * in the target event array.
 */
function mergeHooks(existing, incoming) {
  const merged = { ...existing };
  for (const [event, entries] of Object.entries(incoming)) {
    if (!merged[event]) {
      merged[event] = entries;
      continue;
    }
    const existingCmds = new Set(
      merged[event].flatMap(e => (e.hooks || []).map(h => h.command))
    );
    for (const entry of entries) {
      const cmds = (entry.hooks || []).map(h => h.command);
      if (cmds.every(cmd => existingCmds.has(cmd))) continue;
      merged[event].push(entry);
    }
  }
  return merged;
}

/**
 * Merge our hook entries and statusLine into ~/.claude/settings.json.
 * Creates the file if it doesn't exist. Never overwrites existing keys.
 */
function mergeSettings(results, claudeHome = CLAUDE_HOME) {
  const settingsPath = path.join(claudeHome, 'settings.json');
  const hookEntries = buildHookEntries(claudeHome);
  const statusLine = {
    type: 'command',
    command: `node ${claudeHome.replace(/\\/g, '/')}/statusline.js`,
  };

  if (!fs.existsSync(settingsPath)) {
    fs.mkdirSync(claudeHome, { recursive: true });
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ hooks: hookEntries, statusLine }, null, 2) + '\n',
      'utf8'
    );
    results.installed.push('settings.json (created)');
    return;
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    results.errors.push('settings.json (parse error — skipped)');
    return;
  }

  let changed = false;

  const mergedHooks = mergeHooks(settings.hooks || {}, hookEntries);
  if (JSON.stringify(mergedHooks) !== JSON.stringify(settings.hooks || {})) {
    settings.hooks = mergedHooks;
    changed = true;
  }

  if (!settings.statusLine) {
    settings.statusLine = statusLine;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    results.installed.push('settings.json (merged missing entries)');
  } else {
    results.skipped.push('settings.json');
  }
}

/**
 * Copy a single file from templates/global → ~/.claude/ if destination is absent.
 */
function installFile(relPath, results, claudeHome = CLAUDE_HOME, templatesDir = TEMPLATES_DIR) {
  const src = path.join(templatesDir, relPath);
  const dest = path.join(claudeHome, relPath);

  if (!fs.existsSync(src)) {
    results.errors.push(`${relPath} (template missing)`);
    return;
  }
  if (fs.existsSync(dest)) {
    results.skipped.push(relPath);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  results.installed.push(relPath);
}

/**
 * Install each skill directory under templates/global/skills/ into ~/.claude/skills/.
 * Skips skills that already have a directory at the destination.
 */
function installSkills(results, claudeHome = CLAUDE_HOME, templatesDir = TEMPLATES_DIR) {
  const srcSkillsDir = path.join(templatesDir, 'skills');
  const destSkillsDir = path.join(claudeHome, 'skills');

  if (!fs.existsSync(srcSkillsDir)) return;

  for (const skill of fs.readdirSync(srcSkillsDir)) {
    const srcDir = path.join(srcSkillsDir, skill);
    if (!fs.statSync(srcDir).isDirectory()) continue;

    const destDir = path.join(destSkillsDir, skill);
    if (fs.existsSync(destDir)) {
      results.skipped.push(`skills/${skill}/`);
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
    results.installed.push(`skills/${skill}/`);
  }
}

/**
 * Main setup-global logic.
 *
 * @param {object} opts
 * @param {boolean} [opts.withBinaries=false] - also check/install LSP binaries
 * @param {boolean} [opts.yes=false]          - skip confirmations
 * @returns {{ installed: string[], skipped: string[], errors: string[] }}
 */
async function setupGlobal(opts = {}) {
  const claudeHome = opts._claudeHome || CLAUDE_HOME;
  const templatesDir = opts._templatesDir || TEMPLATES_DIR;
  const results = { installed: [], skipped: [], errors: [] };

  fs.mkdirSync(claudeHome, { recursive: true });

  for (const relPath of STATIC_FILES) {
    installFile(relPath, results, claudeHome, templatesDir);
  }

  installSkills(results, claudeHome, templatesDir);
  mergeSettings(results, claudeHome);

  if (opts.withBinaries) {
    const binResults = await checkAndInstallBinaries(opts.yes);
    results.installed.push(...binResults.installed);
    results.skipped.push(...binResults.skipped);
    results.errors.push(...binResults.errors);
  }

  return results;
}

module.exports = { setupGlobal };
