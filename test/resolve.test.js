'use strict';

const { test, expect, describe } = require('bun:test');
const { buildPaths } = require('../src/utils/resolve');

describe('buildPaths', () => {
  test('builds base URL always pointing to _base', () => {
    // Arrange
    const slugs = ['web', 'fullstack', 'nextjs-app-router'];
    // Act
    const { baseUrl } = buildPaths(slugs);
    // Assert
    expect(baseUrl).toMatch(/\/templates\/_base$/);
  });

  test('builds leaf URL from joined slugs', () => {
    // Arrange
    const slugs = ['web', 'fullstack', 'nextjs-app-router'];
    // Act
    const { leafUrl } = buildPaths(slugs);
    // Assert
    expect(leafUrl).toMatch(/\/templates\/web\/fullstack\/nextjs-app-router$/);
  });

  test('handles single-slug leaf (General Purpose)', () => {
    // Arrange
    const slugs = ['general'];
    // Act
    const { leafUrl } = buildPaths(slugs);
    // Assert
    expect(leafUrl).toMatch(/\/templates\/general$/);
  });

  test('handles two-slug leaf (Mobile / React Native)', () => {
    // Arrange
    const slugs = ['mobile', 'react-native'];
    // Act
    const { leafUrl } = buildPaths(slugs);
    // Assert
    expect(leafUrl).toMatch(/\/templates\/mobile\/react-native$/);
  });
});
