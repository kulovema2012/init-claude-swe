'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { setupGlobal } = require('../src/commands/setup-global');

// Static files the real command installs — mirrored here so tests stay in sync.
const STATIC_FILES = [
  'hooks/warp-autoswitch.mjs',
  'hooks/context-mode-cache-heal.mjs',
  'hooks/apply-skill-overrides.mjs',
  'hooks/gitnexus/gitnexus-hook.cjs',
  'statusline.js',
];

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'swe-setup-global-'));
}

/** Seed template source files so installFile has something to copy. */
function seedTemplates(dir, files = [], skills = []) {
  for (const relPath of files) {
    const full = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, `# ${relPath}`, 'utf8');
  }
  for (const skill of skills) {
    const skillDir = path.join(dir, 'skills', skill);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'skill.md'), `# ${skill}`, 'utf8');
  }
}

describe('setupGlobal', () => {
  let claudeHome;
  let templatesDir;

  beforeEach(() => {
    claudeHome = makeTempDir();
    templatesDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(claudeHome, { recursive: true, force: true });
    fs.rmSync(templatesDir, { recursive: true, force: true });
  });

  // ── static file installation ──────────────────────────────────────────

  test('installs absent static files into claudeHome', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    for (const relPath of STATIC_FILES) {
      expect(fs.existsSync(path.join(claudeHome, relPath))).toBe(true);
    }
    expect(result.installed).toContain('statusline.js');
    expect(result.errors).toHaveLength(0);
  });

  test('skips static files that already exist in claudeHome', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);
    const existing = path.join(claudeHome, 'statusline.js');
    fs.mkdirSync(claudeHome, { recursive: true });
    fs.writeFileSync(existing, '# original', 'utf8');

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(result.skipped).toContain('statusline.js');
    expect(result.installed).not.toContain('statusline.js');
    expect(fs.readFileSync(existing, 'utf8')).toBe('# original');
  });

  test('reports error when a template source file is missing', async () => {
    // Arrange — seed everything except statusline.js
    seedTemplates(templatesDir, STATIC_FILES.filter(f => f !== 'statusline.js'));

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(result.errors.some(e => e.includes('statusline.js'))).toBe(true);
  });

  // ── skill installation ────────────────────────────────────────────────

  test('installs skill directories from templates/skills/', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES, ['my-skill', 'another-skill']);

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(fs.existsSync(path.join(claudeHome, 'skills', 'my-skill', 'skill.md'))).toBe(true);
    expect(fs.existsSync(path.join(claudeHome, 'skills', 'another-skill', 'skill.md'))).toBe(true);
    expect(result.installed).toContain('skills/my-skill/');
    expect(result.installed).toContain('skills/another-skill/');
  });

  test('skips skill directories that already exist in claudeHome', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES, ['my-skill']);
    fs.mkdirSync(path.join(claudeHome, 'skills', 'my-skill'), { recursive: true });

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(result.skipped).toContain('skills/my-skill/');
    expect(result.installed).not.toContain('skills/my-skill/');
  });

  test('does not error when templates/skills/ directory is absent', async () => {
    // Arrange — no skills dir seeded
    seedTemplates(templatesDir, STATIC_FILES);

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(result.errors).toHaveLength(0);
  });

  // ── settings.json ─────────────────────────────────────────────────────

  test('creates settings.json with hooks and statusLine when absent', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);

    // Act
    await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    const settingsPath = path.join(claudeHome, 'settings.json');
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks).toBeDefined();
    expect(settings.hooks.SessionStart).toBeDefined();
    expect(settings.statusLine).toBeDefined();
  });

  test('merges hooks into existing settings.json that lacks them', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);
    const settingsPath = path.join(claudeHome, 'settings.json');
    fs.mkdirSync(claudeHome, { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({ theme: 'dark' }, null, 2), 'utf8');

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.theme).toBe('dark');
    expect(settings.hooks.SessionStart).toBeDefined();
    expect(result.installed.some(i => i.includes('settings.json'))).toBe(true);
  });

  test('skips settings.json when hooks and statusLine are already present', async () => {
    // Arrange — first run populates settings.json fully
    seedTemplates(templatesDir, STATIC_FILES);
    await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Act — second run should find nothing to change
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(result.skipped).toContain('settings.json');
    expect(result.installed.some(i => i.includes('settings.json'))).toBe(false);
  });

  test('does not overwrite statusLine already present in settings.json', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);
    const settingsPath = path.join(claudeHome, 'settings.json');
    fs.mkdirSync(claudeHome, { recursive: true });
    const existing = { statusLine: { type: 'command', command: 'node /custom/statusline.js' } };
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2), 'utf8');

    // Act
    await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    expect(settings.statusLine.command).toBe('node /custom/statusline.js');
  });

  test('reports error when settings.json contains invalid JSON', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);
    const settingsPath = path.join(claudeHome, 'settings.json');
    fs.mkdirSync(claudeHome, { recursive: true });
    fs.writeFileSync(settingsPath, '{ invalid json }', 'utf8');

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(result.errors.some(e => e.includes('settings.json') && e.includes('parse error'))).toBe(true);
  });

  // ── hooks deduplication ───────────────────────────────────────────────

  test('does not duplicate hook entries on repeated runs', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);
    await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Act
    await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    const settings = JSON.parse(fs.readFileSync(path.join(claudeHome, 'settings.json'), 'utf8'));
    const sessionStartCmds = settings.hooks.SessionStart.flatMap(e => e.hooks.map(h => h.command));
    const uniqueCmds = new Set(sessionStartCmds);
    expect(sessionStartCmds.length).toBe(uniqueCmds.size);
  });

  // ── return shape ──────────────────────────────────────────────────────

  test('always returns an object with installed, skipped, and errors arrays', async () => {
    // Arrange
    seedTemplates(templatesDir, STATIC_FILES);

    // Act
    const result = await setupGlobal({ _claudeHome: claudeHome, _templatesDir: templatesDir });

    // Assert
    expect(Array.isArray(result.installed)).toBe(true);
    expect(Array.isArray(result.skipped)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
