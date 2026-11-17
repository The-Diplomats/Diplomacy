// Mirrors compat-check.yml. Usage: pnpm --filter @diplomacy/contracts compat [base-ref], default origin/main.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// Same image the oasdiff-action pin in compat-check.yml runs; bump them together.
const OASDIFF_IMAGE = 'tufin/oasdiff:v1.38.0';
const SPEC_ENTRY = 'api/public/openapi.yaml';

const baseRef = process.argv[2] ?? 'origin/main';

// Not the .bin shim: on Windows that's a .cmd needing a shell, which splits paths with spaces.
const redoclyManifest = createRequire(import.meta.url).resolve('@redocly/cli/package.json');
const redoclyBin = join(
  dirname(redoclyManifest),
  (JSON.parse(readFileSync(redoclyManifest, 'utf8')) as { bin: { redocly: string } }).bin.redocly,
);

function run(command: string, args: string[], input?: Buffer): Buffer {
  return execFileSync(command, args, { input, stdio: ['pipe', 'pipe', 'inherit'] });
}

function bundle(entry: string, output: string): void {
  run(process.execPath, [redoclyBin, 'bundle', entry, '-o', output]);
}

const workDir = mkdtempSync(join(tmpdir(), 'diplomacy-compat-'));
try {
  const commit = run('git', ['rev-parse', '--short', baseRef]).toString().trim();
  console.log(`Comparing the working tree against ${baseRef} (${commit})`);

  const baseDir = join(workDir, 'base');
  mkdirSync(baseDir);
  run('tar', ['-x', '-C', baseDir], run('git', ['archive', '--format=tar', baseRef, 'api']));

  // Bundled as in CI; unbundled specs give oasdiff false positives from $ref drift.
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
    { stdio: 'inherit' },
  );
  if (result.error) {
    throw result.error;
  }
  // oasdiff exits 1 on error-level changes (warnings alone pass), >= 2 if it couldn't load a spec.
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
