'use strict';

const { Command } = require('commander');
const { install } = require('./commands/install');
const pkg = require('../package.json');

async function getClack() {
  return import('@clack/prompts');
}

function createProgram() {
  const program = new Command();

  program
    .name('init-claude-swe')
    .description('Claude Code scaffold installer')
    .version(pkg.version);

  program
    .command('install', { isDefault: true })
    .description('Scaffold .claude/ directory for your project')
    .option('--category <category>', 'Category slug (CI mode)')
    .option('--type <type>', 'Type slug (CI mode)')
    .option('--stack <stack>', 'Stack slug (CI mode)')
    .option('-s, --scope <scope>', 'Scope: project or local (CI mode)')
    .option('-y, --yes', 'Skip overwrite confirmation')
    .action(async (opts) => {
      const { intro, outro } = await getClack();
      intro(`init-claude-swe  v${pkg.version} — Claude Code scaffold installer`);
      try {
        const result = await install({
          category: opts.category,
          type: opts.type,
          stack: opts.stack,
          scope: opts.scope,
          yes: opts.yes,
          cwd: process.cwd(),
          isTTY: !!process.stdin.isTTY,
        });
        outro(
          `All done! Scaffold installed for ${result.stackLabel}.\n\n` +
          `  Next steps:\n` +
          `  1. Open Claude Code in this directory\n` +
          `  2. Review CLAUDE.md for your role setup\n` +
          `  3. Explore .claude/rules/ to customise your workflow`
        );
      } catch (err) {
        process.stderr.write(err.message + '\n');
        process.exit(1);
      }
    });

  return program;
}

async function run(argv) {
  const program = createProgram();
  await program.parseAsync(argv);
}

module.exports = { createProgram, run };
