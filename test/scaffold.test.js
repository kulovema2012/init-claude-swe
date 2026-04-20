'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mergeManifests, writeAll } = require('../src/utils/scaffold');

describe('mergeManifests', () => {
  test('base files appear in the merged map', () => {
    // Arrange
    const baseFiles = ['.claude/settings.json', '.claude/rules/testing-aaa.md'];
    const leafFiles = ['CLAUDE.md'];
    // Act
    const map = mergeManifests(baseFiles, leafFiles, 'http://base', 'http://leaf');
    // Assert
    expect(map.has('.claude/settings.json')).toBe(true);
    expect(map.get('.claude/settings.json')).toBe('http://base/.claude/settings.json');
  });

  test('leaf files override base files with same path', () => {
    // Arrange
    const baseFiles = ['.claude/rules/environment-isolation.md'];
    const leafFiles = ['.claude/rules/environment-isolation.md', 'CLAUDE.md'];
    // Act
    const map = mergeManifests(baseFiles, leafFiles, 'http://base', 'http://leaf');
    // Assert
    expect(map.get('.claude/rules/environment-isolation.md'))
      .toBe('http://leaf/.claude/rules/environment-isolation.md');
  });

  test('leaf-only files are included', () => {
    // Arrange
    const baseFiles = ['.claude/settings.json'];
    const leafFiles = ['CLAUDE.md'];
    // Act
    const map = mergeManifests(baseFiles, leafFiles, 'http://base', 'http://leaf');
    // Assert
    expect(map.has('CLAUDE.md')).toBe(true);
    expect(map.get('CLAUDE.md')).toBe('http://leaf/CLAUDE.md');
  });

  test('returns empty map when both file lists are empty', () => {
    // Arrange / Act
    const map = mergeManifests([], [], 'http://base', 'http://leaf');
    // Assert
    expect(map.size).toBe(0);
  });

  test('normalises trailing slash in URLs', () => {
    // Arrange
    const baseFiles = ['CLAUDE.md'];
    const leafFiles = [];
    // Act
    const map = mergeManifests(baseFiles, leafFiles, 'http://base/', 'http://leaf/');
    // Assert
    expect(map.get('CLAUDE.md')).toBe('http://base/CLAUDE.md');
  });
});

describe('writeAll', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('writes files to correct paths creating subdirs', () => {
    // Arrange
    const contentMap = new Map([
      ['CLAUDE.md', '# Role: Engineer'],
      ['.claude/settings.json', '{}'],
      ['.claude/rules/testing-aaa.md', '# Testing'],
    ]);
    // Act
    writeAll(contentMap, tmpDir, 'project');
    // Assert
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'settings.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'rules', 'testing-aaa.md'))).toBe(true);
  });

  test('writes CLAUDE.local.md for local scope', () => {
    // Arrange
    const contentMap = new Map([['CLAUDE.md', '# Role']]);
    // Act
    writeAll(contentMap, tmpDir, 'local');
    // Assert
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.local.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(false);
  });

  test('writes correct file content', () => {
    // Arrange
    const contentMap = new Map([['CLAUDE.md', '# My Role Content']]);
    // Act
    writeAll(contentMap, tmpDir, 'project');
    // Assert
    expect(fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8')).toBe('# My Role Content');
  });

  test('does not rename CLAUDE.md for project scope', () => {
    // Arrange
    const contentMap = new Map([['CLAUDE.md', '# Role']]);
    // Act
    writeAll(contentMap, tmpDir, 'project');
    // Assert
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.local.md'))).toBe(false);
  });

  test('throws for unknown scope', () => {
    // Arrange
    const contentMap = new Map([['CLAUDE.md', '# Role']]);
    // Act & Assert
    expect(() => writeAll(contentMap, tmpDir, 'unknown')).toThrow('unknown scope');
  });
});
