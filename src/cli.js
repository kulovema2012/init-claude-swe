'use strict';

const { Command } = require('commander');
const { install } = require('./commands/install');
const pkg = require('../package.json');

/**
 * Create and configure the commander program.
 * @returns {Command}
 */
function createProgram() {
  const program = new Command();

  program
    .name('init-claude-swe')
    .description('Fetch and install CLAUDE.md templates into any project')
    .version(pkg.version);

  program
    .command('install', { isDefault: true })
    .description('Install a CLAUDE.md template (default command)')
    .option('-t, --template <name>', 'Template to install', 'default')
    .option('-s, --scope <scope>', 'Scope: project or local')
    .action(async (opts) => {
      try {
        const result = await install({
          scope: opts.scope,
          templateName: opts.template,
          cwd: process.cwd(),
          isTTY: !!process.stdin.isTTY,
        });
        process.stdout.write(
          `✓ ${result.filename} added to your project. (${result.templateName} template, ${result.scope} scope)\n`
        );
      } catch (err) {
        process.stderr.write(err.message + '\n');
        process.exit(1);
      }
    });

  return program;
}

/**
 * Main entry point — parses argv and runs the appropriate command.
 * @param {string[]} argv
 */
async function run(argv) {
  const program = createProgram();
  await program.parseAsync(argv);
}

module.exports = { createProgram, run };
