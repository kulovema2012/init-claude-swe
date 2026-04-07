'use strict';

const { test, expect, describe } = require('bun:test');
const { promptScope, promptTemplate, promptOverwrite } = require('../src/utils/prompt');

describe('promptScope', () => {
  test('returns "project" for input "1"', async () => {
    // Arrange — mock stdin to answer "1"
    const result = await promptScope({ simulate: '1' });
    expect(result).toBe('project');
  });

  test('returns "local" for input "2"', async () => {
    const result = await promptScope({ simulate: '2' });
    expect(result).toBe('local');
  });

  test('defaults to "project" for empty input', async () => {
    const result = await promptScope({ simulate: '' });
    expect(result).toBe('project');
  });
});

describe('promptTemplate', () => {
  test('returns template name for valid number', async () => {
    const result = await promptTemplate({ simulate: '1' });
    expect(result).toBe('default');
  });

  test('returns default for invalid input', async () => {
    const result = await promptTemplate({ simulate: '99' });
    expect(result).toBe('default');
  });
});

describe('promptOverwrite', () => {
  test('returns true for "y"', async () => {
    const result = await promptOverwrite({ simulate: 'y' });
    expect(result).toBe(true);
  });

  test('returns false for "n"', async () => {
    const result = await promptOverwrite({ simulate: 'n' });
    expect(result).toBe(false);
  });
});