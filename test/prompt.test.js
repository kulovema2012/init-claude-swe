'use strict';

const { test, expect, describe } = require('bun:test');
const { promptSelections, promptOverwrite } = require('../src/utils/prompt');

describe('promptSelections (simulate mode)', () => {
  test('returns slugs and scope from simulate object', async () => {
    // Arrange
    const simulate = { slugs: ['web', 'fullstack', 'nextjs-app-router'], scope: 'project' };
    // Act
    const result = await promptSelections({ simulate });
    // Assert
    expect(result.slugs).toEqual(['web', 'fullstack', 'nextjs-app-router']);
    expect(result.scope).toBe('project');
  });

  test('returns local scope when specified', async () => {
    // Arrange
    const simulate = { slugs: ['general'], scope: 'local' };
    // Act
    const result = await promptSelections({ simulate });
    // Assert
    expect(result.scope).toBe('local');
  });

  test('works for two-level selections (mobile/react-native)', async () => {
    // Arrange
    const simulate = { slugs: ['mobile', 'react-native'], scope: 'project' };
    // Act
    const result = await promptSelections({ simulate });
    // Assert
    expect(result.slugs).toEqual(['mobile', 'react-native']);
  });
});

describe('promptOverwrite (simulate mode)', () => {
  test('returns true when simulate is true', async () => {
    // Arrange / Act
    const result = await promptOverwrite({ simulate: true });
    // Assert
    expect(result).toBe(true);
  });

  test('returns false when simulate is false', async () => {
    // Arrange / Act
    const result = await promptOverwrite({ simulate: false });
    // Assert
    expect(result).toBe(false);
  });
});
