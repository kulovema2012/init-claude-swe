'use strict';

const { spawnSync } = require('child_process');

const BINARIES = [
  {
    name: 'typescript-language-server',
    check: ['typescript-language-server', ['--version']],
    install: ['npm', ['install', '-g', 'typescript-language-server', 'typescript']],
    label: 'TypeScript LSP (typescript-language-server + typescript)',
  },
  {
    name: 'pyright-langserver',
    check: ['pyright-langserver', ['--help']],
    install: ['npm', ['install', '-g', 'pyright']],
    label: 'Python LSP (pyright)',
    ignoreExitCode: true,
  },
  {
    name: 'gopls',
    check: ['gopls', ['version']],
    install: ['go', ['install', 'golang.org/x/tools/gopls@latest']],
    label: 'Go LSP (gopls)',
    requiresRuntime: 'go',
  },
  {
    name: 'semgrep',
    check: ['semgrep', ['--version']],
    install: ['pip', ['install', 'semgrep']],
    label: 'Semgrep security scanner',
    requiresRuntime: 'pip',
  },
];

function binaryExists(bin) {
  const result = spawnSync(bin.check[0], bin.check[1], {
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (bin.ignoreExitCode) return !result.error;
  return !result.error && (result.status === 0 || (result.stdout && result.stdout.length > 0));
}

function runtimeExists(runtime) {
  const result = spawnSync(runtime, ['--version'], {
    encoding: 'utf-8',
    timeout: 5000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return !result.error && result.status === 0;
}

function runInstall(bin) {
  const result = spawnSync(bin.install[0], bin.install[1], {
    stdio: 'inherit',
    timeout: 180000,
  });
  return !result.error && result.status === 0;
}

/**
 * Check for required LSP and tooling binaries, installing any that are missing.
 * @param {boolean} yes - auto-install without confirmation
 * @returns {{ installed: string[], skipped: string[], errors: string[] }}
 */
async function checkAndInstallBinaries(yes = false) {
  const results = { installed: [], skipped: [], errors: [] };

  for (const bin of BINARIES) {
    if (bin.requiresRuntime && !runtimeExists(bin.requiresRuntime)) {
      results.skipped.push(`${bin.label} (${bin.requiresRuntime} not found — skipped)`);
      continue;
    }

    if (binaryExists(bin)) {
      results.skipped.push(`${bin.label} (already installed)`);
      continue;
    }

    const ok = runInstall(bin);
    if (ok) {
      results.installed.push(bin.label);
    } else {
      const cmd = [bin.install[0], ...bin.install[1]].join(' ');
      results.errors.push(`${bin.label} — install failed. Run manually: ${cmd}`);
    }
  }

  return results;
}

module.exports = { checkAndInstallBinaries, BINARIES };
