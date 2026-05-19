'use strict';

const { TREE } = require('../navigation');

/**
 * Run multi-level category/type/stack + scope prompts via @clack/prompts.
 * In simulate mode, returns opts.simulate directly (for testing and CI).
 * @param {object} [opts]
 * @param {{ slugs: string[], scope: string }} [opts.simulate] - bypass clack for testing
 * @returns {Promise<{ slugs: string[], scope: string }>}
 */
async function promptSelections(opts = {}) {
  if (opts.simulate !== undefined) return opts.simulate;

  const { select, isCancel, cancel } = await import('@clack/prompts');

  function check(result) {
    if (isCancel(result)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    return result;
  }

  const slugs = [];

  // Level 1: Category
  const catSlug = check(await select({
    message: 'What are you building?',
    options: TREE.map((n) => ({ value: n.slug, label: n.label })),
  }));
  slugs.push(catSlug);
  const catNode = TREE.find((n) => n.slug === catSlug);

  if (catNode && catNode.children) {
    // Level 2: Sub-type
    const typeSlug = check(await select({
      message: 'Project type?',
      options: catNode.children.map((n) => ({ value: n.slug, label: n.label })),
    }));
    slugs.push(typeSlug);
    const typeNode = catNode.children.find((n) => n.slug === typeSlug);

    if (typeNode && typeNode.children) {
      // Level 3: Stack
      const stackSlug = check(await select({
        message: 'Stack?',
        options: typeNode.children.map((n) => ({ value: n.slug, label: n.label })),
      }));
      slugs.push(stackSlug);
    }
  }

  // Scope selection
  const scope = check(await select({
    message: 'Install scope?',
    options: [
      { value: 'project', label: 'project', hint: 'CLAUDE.md — committed to git' },
      { value: 'local', label: 'local', hint: 'CLAUDE.local.md — gitignored' },
    ],
  }));

  return { slugs, scope };
}

/**
 * Prompt to confirm overwriting existing files.
 * @param {object} [opts]
 * @param {boolean} [opts.simulate] - bypass clack for testing
 * @returns {Promise<boolean>}
 */
async function promptOverwrite(opts = {}) {
  if (opts.simulate !== undefined) return opts.simulate;
  const { confirm, isCancel, cancel } = await import('@clack/prompts');
  const result = await confirm({ message: 'Files already exist — overwrite?' });
  if (isCancel(result)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
  return result;
}

module.exports = { promptSelections, promptOverwrite };
