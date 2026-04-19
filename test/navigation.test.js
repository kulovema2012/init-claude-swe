'use strict';

const { test, expect, describe } = require('bun:test');
const { TREE, BASE_URL } = require('../src/navigation');

describe('TREE', () => {
  test('has 7 top-level categories', () => {
    expect(TREE).toHaveLength(7);
  });

  test('every node has label and slug', () => {
    function walk(nodes) {
      for (const node of nodes) {
        expect(typeof node.label).toBe('string');
        expect(typeof node.slug).toBe('string');
        expect(node.slug).toMatch(/^[a-z0-9-]+$/);
        if (node.children) walk(node.children);
      }
    }
    walk(TREE);
  });

  test('all slugs are unique within their parent', () => {
    function checkUnique(nodes) {
      const slugs = nodes.map((n) => n.slug);
      const unique = new Set(slugs);
      expect(unique.size).toBe(slugs.length);
      for (const node of nodes) {
        if (node.children) checkUnique(node.children);
      }
    }
    checkUnique(TREE);
  });

  test('General Purpose has no children (leaf at level 1)', () => {
    const general = TREE.find((n) => n.slug === 'general');
    expect(general).toBeDefined();
    expect(general.children).toBeUndefined();
  });
});

describe('BASE_URL', () => {
  test('points to GitHub raw templates directory', () => {
    expect(BASE_URL).toMatch(/^https:\/\/raw\.githubusercontent\.com\//);
    expect(BASE_URL).toContain('/templates');
  });
});
