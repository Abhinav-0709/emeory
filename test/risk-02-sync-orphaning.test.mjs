import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ProjectAnalyzer } from '../packages/analyzer/dist/analyzer.js';
import { LocalStructuredMemoryStore } from '../packages/core/dist/storage/local-fs.js';

test('Risk #2: File rename / orphaning test scenario', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emeory-test-orphan-'));
  
  try {
    // 1. Setup project with package.json and src/auth/login.ts
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'orphan-test-app', version: '1.0.0' }));
    fs.mkdirSync(path.join(tempDir, 'src', 'auth'), { recursive: true });
    const loginFilePath = path.join(tempDir, 'src', 'auth', 'login.ts');
    fs.writeFileSync(loginFilePath, 'export function login() { return true; }');

    // 2. Initialize memory and record ADR referencing src/auth/login.ts
    const store = new LocalStructuredMemoryStore({ projectRoot: tempDir });
    store.initialize({ name: 'orphan-test-app', version: '1.0.0', rootPath: tempDir });

    const state = store.readState();
    assert.ok(state);
    
    state.decisions.push({
      id: 'ADR-001',
      title: 'Authentication Strategy',
      status: 'accepted',
      context: 'User login handled via login.ts',
      decision: 'Implement custom token login',
      rationale: 'Decoupled auth handler',
      source: {
        type: 'source-code',
        reference: 'src/auth/login.ts',
      },
    });
    store.saveState(state);

    // 3. Rename src/auth/login.ts -> src/auth/signin.ts
    const signinFilePath = path.join(tempDir, 'src', 'auth', 'signin.ts');
    fs.renameSync(loginFilePath, signinFilePath);

    // 4. Run sync / analyze
    const analyzer = new ProjectAnalyzer(tempDir);
    analyzer.analyze();

    // 5. Inspect updated state
    const updatedState = store.readState();
    assert.ok(updatedState);

    // Assert: Decision was NOT deleted or dropped (no data loss)
    assert.equal(updatedState.decisions.length, 1);
    assert.equal(updatedState.decisions[0].id, 'ADR-001');

    // Assert: Discrepancy detected for the orphaned file reference
    assert.ok(updatedState.discrepancies.length > 0, 'Should detect orphaned file reference discrepancy');
    const orphanDisc = updatedState.discrepancies.find((d) => d.id === 'disc-orphan-ADR-001');
    assert.ok(orphanDisc, 'Discrepancy for ADR-001 must exist');
    assert.match(orphanDisc.claimedByDoc.statement, /src\/auth\/login\.ts/);
    assert.match(orphanDisc.actualInCode.statement, /Possible rename detected: "src\/auth\/signin\.ts"/);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
