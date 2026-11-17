// Mirrors compat-check.yml. Usage: pnpm --filter @diplomacy/contracts compat [base-ref], default origin/main.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Same image the oasdiff-action pin in compat-check.yml runs; bump them together.
const OASDIFF_IMAGE = 'tufin/oasdiff:v1.38.0';
const SPEC_ENTRY = 'api/public/openapi.yaml';

const baseRef = process.argv[2] ?? 'origin/main';
// pnpm puts node_modules/.bin on PATH; Windows needs a shell to resolve redocly.cmd.
const shell = process.platform === 'win32';

function run(command: string, args: string[], input?: Buffer): Buffer {
  return execFileSync(command, args, { input, shell, stdio: ['pipe', 'pipe', 'inherit'] });
}

function bundle(entry: string, output: string): void {
  run('redocly', ['bundle', entry, '-o', output]);
}

const workDir = mkdtempSync(join(tmpdir(), 'diplomacy-compat-'));
try {
  const commit = run('git', ['rev-parse', '--short', baseRef]).toString().trim();
  console.log(`Comparing the working tree against ${baseRef} (${commit})`);

  // Extract the base ref's api/ tree so redocly can resolve its relative $refs.
  const baseDir = join(workDir, 'base');
  mkdirSync(baseDir);
  run('tar', ['-x', '-C', baseDir], run('git', ['archive', '--format=tar', baseRef, 'api']));

  // Both sides are bundled first, as in CI, so oasdiff never sees $ref representation drift.
  bundle(join(baseDir, SPEC_ENTRY), join(workDir, 'base.yaml'));
  bundle(SPEC_ENTRY, join(workDir, 'head.yaml'));

  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-v',
      `${workDir}:/specs:ro`,
      OASDIFF_IMAGE,
      'breaking',
      '/specs/base.yaml',
      '/specs/head.yaml',
      '--fail-on',
      'ERR',
    ],
    { stdio: 'inherit', shell },
  );
  if (result.error) {
    throw result.error;
  }
  // oasdiff exits 1 on error-level changes (warnings alone pass), >= 2 if it couldn't load a spec.
  process.exitCode = result.status ?? 1;
} catch (error) {
  // The failing command already printed its own error to stderr.
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
