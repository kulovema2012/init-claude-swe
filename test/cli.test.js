'use strict';

const { test, expect, describe } = require('bun:test');
const { createProgram } = require('../src/cli');

describe('createProgram', () => {
  test('has install as default command', () => {
    // Arrange
    const program = createProgram();
    // Act
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Assert
    expect(installCmd).toBeDefined();
  });

  test('has --template option on install', () => {
    // Arrange
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Act
    const opts = installCmd.options.map((o) => o.long);
    // Assert
    expect(opts).toContain('--template');
  });

  test('has --scope option on install', () => {
    // Arrange
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Act
    const opts = installCmd.options.map((o) => o.long);
    // Assert
    expect(opts).toContain('--scope');
  });
});
