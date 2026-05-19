'use strict';

const { test, expect, describe } = require('bun:test');
const { TREE, BASE_URL } = require('../src/navigation');

describe('TREE', () => {
  test('has 7 top-level categories', () => {
    // Arrange — TREE imported at module level
    // Act — access array directly
    // Assert
    expect(TREE).toHaveLength(7);
  });

  test('every node has label and slug', () => {
    // Arrange — TREE imported at module level
    function walk(nodes) {
      for (const node of nodes) {
        expect(typeof node.label).toBe('string');
        expect(typeof node.slug).toBe('string');
        expect(node.slug).toMatch(/^[a-z0-9-]+$/);
        if (node.children) walk(node.children);
      }
    }
    // Act
    // Assert
    walk(TREE);
  });

  test('all slugs are unique within their parent', () => {
    // Arrange — TREE imported at module level
    function checkUnique(nodes) {
      const slugs = nodes.map((n) => n.slug);
      const unique = new Set(slugs);
      expect(unique.size).toBe(slugs.length);
      for (const node of nodes) {
        if (node.children) checkUnique(node.children);
      }
    }
    // Act
    // Assert
    checkUnique(TREE);
  });

  test('General Purpose has no children (leaf at level 1)', () => {
    // Arrange — TREE imported at module level
    // Act
    const general = TREE.find((n) => n.slug === 'general');
    // Assert
    expect(general).toBeDefined();
    expect(general.children).toBeUndefined();
  });
});

describe('BASE_URL', () => {
  test('points to GitHub raw templates directory', () => {
    // Arrange — BASE_URL imported at module level
    // Act — access constant directly
    // Assert
    expect(BASE_URL).toMatch(/^https:\/\/raw\.githubusercontent\.com\//);
    expect(BASE_URL).toMatch(/\/templates$/);
  });
});
