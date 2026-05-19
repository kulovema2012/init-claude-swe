'use strict';

const { Command } = require('commander');
const { install } = require('./commands/install');
const { setupGlobal } = require('./commands/setup-global');
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

  program
    .command('setup-global')
    .description('Install global Claude Code config: hooks, skills, statusline, and settings')
    .option('--with-binaries', 'Also check and install missing LSP binaries (gopls, pyright, semgrep, typescript-language-server)')
    .option('-y, --yes', 'Skip confirmations')
    .action(async (opts) => {
      const { intro, outro, log } = await getClack();
      intro(`init-claude-swe  v${pkg.version} — Claude Code global setup`);
      try {
        const results = await setupGlobal({
          withBinaries: !!opts.withBinaries,
          yes: !!opts.yes,
        });

        if (results.installed.length > 0) {
          log.success(`Installed (${results.installed.length}):\n` +
            results.installed.map(f => `    + ${f}`).join('\n'));
        }
        if (results.skipped.length > 0) {
          log.info(`Skipped (${results.skipped.length}):\n` +
            results.skipped.map(f => `    ~ ${f}`).join('\n'));
        }
        if (results.errors.length > 0) {
          log.warn(`Warnings (${results.errors.length}):\n` +
            results.errors.map(f => `    ! ${f}`).join('\n'));
        }

        outro(
          `Global setup complete.\n\n` +
          `  Next steps:\n` +
          `  1. Run /reload-plugins in Claude Code\n` +
          `  2. Restart your Claude Code session`
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
