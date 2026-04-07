'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ensureGitignoreEntry } = require('../src/utils/gitignore');

describe('ensureGitignoreEntry', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-claude-git-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('creates .gitignore with entry when file does not exist', () => {
    // Arrange
    const gitignorePath = path.join(tmpDir, '.gitignore');
    // Act
    ensureGitignoreEntry(tmpDir, 'CLAUDE.md');
    // Assert
    expect(fs.readFileSync(gitignorePath, 'utf8')).toBe('CLAUDE.md\n');
  });

  test('appends entry to existing .gitignore', () => {
    // Arrange
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\n');
    // Act
    ensureGitignoreEntry(tmpDir, 'CLAUDE.md');
    // Assert
    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toBe('node_modules/\nCLAUDE.md\n');
  });

  test('does not duplicate if entry already exists', () => {
    // Arrange
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\nCLAUDE.md\n');
    // Act
    ensureGitignoreEntry(tmpDir, 'CLAUDE.md');
    // Assert
    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toBe('node_modules/\nCLAUDE.md\n');
  });

  test('appends entry when .gitignore has no trailing newline', () => {
    // Arrange
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/');
    // Act
    ensureGitignoreEntry(tmpDir, 'CLAUDE.md');
    // Assert
    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toBe('node_modules/\nCLAUDE.md\n');
  });

  test('detects entry in middle of file without duplicating', () => {
    // Arrange
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\nCLAUDE.md\ndist/\n');
    // Act
    ensureGitignoreEntry(tmpDir, 'CLAUDE.md');
    // Assert
    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toBe('node_modules/\nCLAUDE.md\ndist/\n');
  });
});