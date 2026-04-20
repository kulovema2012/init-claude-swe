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

  test('has --scope option', () => {
    // Arrange
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Act
    const opts = installCmd.options.map((o) => o.long);
    // Assert
    expect(opts).toContain('--scope');
  });

  test('has --yes option', () => {
    // Arrange
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Act
    const opts = installCmd.options.map((o) => o.long);
    // Assert
    expect(opts).toContain('--yes');
  });

  test('has --category option', () => {
    // Arrange
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Act
    const opts = installCmd.options.map((o) => o.long);
    // Assert
    expect(opts).toContain('--category');
  });

  test('has --stack option', () => {
    // Arrange
    const program = createProgram();
    const installCmd = program.commands.find((c) => c.name() === 'install');
    // Act
    const opts = installCmd.options.map((o) => o.long);
    // Assert
    expect(opts).toContain('--stack');
  });
});
