'use strict';

const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkDestination } = require('../src/cli');

describe('checkDestination', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'init-claude-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('returns exists:false when path does not exist', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    // Act
    const result = checkDestination(target);
    // Assert
    expect(result).toEqual({ exists: false, isDir: false });
  });

  test('returns exists:true, isDir:false for a regular file', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    fs.writeFileSync(target, 'content');
    // Act
    const result = checkDestination(target);
    // Assert
    expect(result).toEqual({ exists: true, isDir: false });
  });

  test('returns exists:true, isDir:true when path is a directory', () => {
    // Arrange
    const target = path.join(tmpDir, 'CLAUDE.md');
    fs.mkdirSync(target);
    // Act
    const result = checkDestination(target);
    // Assert
    expect(result).toEqual({ exists: true, isDir: true });
  });
});
