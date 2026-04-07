'use strict';

const readline = require('readline');
const { TEMPLATES } = require('../templates');

/**
 * Prompt the user to select a scope.
 * @param {{ simulate?: string }} [opts] - test injection: bypasses readline
 * @returns {Promise<string>} "project" or "local"
 */
function promptScope(opts) {
  if (opts && opts.simulate !== undefined) {
    const answer = opts.simulate.trim();
    return Promise.resolve(answer === '2' ? 'local' : 'project');
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Select scope:\n  1) project\n  2) local\nEnter number [1]: ', (answer) => {
      rl.close();
      resolve(answer.trim() === '2' ? 'local' : 'project');
    });
  });
}

/**
 * Prompt the user to select a template.
 * @param {{ simulate?: string }} [opts] - test injection: bypasses readline
 * @returns {Promise<string>} template name
 */
function promptTemplate(opts) {
  const names = Object.keys(TEMPLATES);
  if (opts && opts.simulate !== undefined) {
    const idx = parseInt(opts.simulate, 10) - 1;
    return Promise.resolve((idx >= 0 && idx < names.length) ? names[idx] : 'default');
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const list = names.map((n, i) => `  ${i + 1}) ${n}`).join('\n');
    rl.question(`Select a template:\n${list}\nEnter number [1]: `, (answer) => {
      rl.close();
      const idx = parseInt(answer, 10) - 1;
      resolve((idx >= 0 && idx < names.length) ? names[idx] : 'default');
    });
  });
}

/**
 * Prompt the user to confirm overwriting an existing file.
 * @param {{ simulate?: string }} [opts] - test injection: bypasses readline
 * @returns {Promise<boolean>}
 */
function promptOverwrite(opts) {
  if (opts && opts.simulate !== undefined) {
    return Promise.resolve(opts.simulate === 'y' || opts.simulate === 'Y');
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('File already exists. Overwrite? (y/N) ', (answer) => {
      rl.close();
      resolve(answer === 'y' || answer === 'Y');
    });
  });
}

module.exports = { promptScope, promptTemplate, promptOverwrite };