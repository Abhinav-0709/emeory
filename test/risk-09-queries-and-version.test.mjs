import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { ProjectAnalyzer } from '../packages/analyzer/dist/analyzer.js';
import { MemoryRetriever } from '../packages/core/dist/retrieval/retriever.js';
const pkgJson = JSON.parse(fs.readFileSync(path.resolve('packages/cli/package.json'), 'utf-8'));
const expectedVersion = `v${pkgJson.version}`;

test('Version flag: -v and --version output current CLI version', () => {
  const cliPath = path.resolve('packages/cli/dist/index.js');
  const outShort = execSync(`node "${cliPath}" -v`, { encoding: 'utf-8' }).trim();
  const outLong = execSync(`node "${cliPath}" --version`, { encoding: 'utf-8' }).trim();

  assert.equal(outShort, expectedVersion);
  assert.equal(outLong, expectedVersion);
});

test('Feature queries: typo tolerance and intent classification', () => {
  const retriever = new MemoryRetriever(process.cwd());

  const intent1 = retriever.classifyIntent('tell me something about the featues');
  assert.equal(intent1, 'feature_query', 'Should classify "featues" typo as feature_query');

  const intent2 = retriever.classifyIntent('what are the key capabilities?');
  assert.equal(intent2, 'feature_query');

  const intent3 = retriever.classifyIntent('what can this project do');
  assert.equal(intent3, 'feature_query');
});

test('ProjectAnalyzer: extracts real description, scripts, and parsed README sections', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emeory-test-desc-'));

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'custom-hardware-monitor',
        version: '2.5.0',
        description: 'Real-time telemetry and GPU curve tuner',
        scripts: { build: 'tsc', test: 'vitest' },
      })
    );

    fs.writeFileSync(
      path.join(tempDir, 'README.md'),
      `# Custom Hardware Monitor\n\nHigh-performance GPU utility.\n\n## Features\n\n- Fan curve control\n- Thermal monitoring\n- Power profiling\n\n## Architecture\n\nKernel driver bridge.\n`
    );

    const analyzer = new ProjectAnalyzer(tempDir);
    analyzer.analyze();

    const retriever = new MemoryRetriever(tempDir);
    const context = retriever.retrieve('tell me something about the featues');

    assert.equal(context.intent, 'feature_query');
    assert.ok(context.directAnswer);
    assert.match(context.directAnswer, /Fan curve control/);
    assert.match(context.directAnswer, /Thermal monitoring/);

    const otherContext = retriever.retrieve('what is this project tell me something other than this overview');
    assert.ok(otherContext.directAnswer);
    assert.match(otherContext.directAnswer, /Detailed Context/);
    assert.match(otherContext.directAnswer, /Fan curve control/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
