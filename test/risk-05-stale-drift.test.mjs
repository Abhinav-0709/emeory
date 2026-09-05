import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ProjectAnalyzer } from '../packages/analyzer/dist/analyzer.js';
import { LocalStructuredMemoryStore } from '../packages/core/dist/storage/local-fs.js';
import { McpMemoryService } from '../packages/mcp/dist/mcp-service.js';

test('Risk #5: Stale memory & automatic dependency drift detection', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emeory-test-drift-'));

  try {
    // 1. Setup project with package.json (no Redis)
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'drift-test-app',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.2',
        },
      })
    );

    // 2. Initialize memory with an ADR claiming Redis is used
    const store = new LocalStructuredMemoryStore({ projectRoot: tempDir });
    store.initialize({ name: 'drift-test-app', version: '1.0.0', rootPath: tempDir });

    const state = store.readState();
    assert.ok(state);

    state.decisions.push({
      id: 'ADR-002',
      title: 'Distributed Session Caching with Redis',
      status: 'accepted',
      context: 'Sessions require fast in-memory store',
      decision: 'Deploy Redis cluster for caching',
      rationale: 'Redis provides sub-millisecond latency',
      source: {
        type: 'documentation',
        reference: 'docs/adr-002.md',
      },
    });
    store.saveState(state);

    // 3. Run analyzer / sync
    const analyzer = new ProjectAnalyzer(tempDir);
    analyzer.analyze();

    // 4. Verify discrepancy is recorded in structured state
    const updatedState = store.readState();
    assert.ok(updatedState);
    const redisDrift = updatedState.discrepancies.find((d) => d.id === 'disc-ADR-002-redis');
    assert.ok(redisDrift, 'Redis dependency drift must be detected');
    assert.match(redisDrift.topic, /REDIS dependency drift/);
    assert.match(redisDrift.claimedByDoc.statement, /Decision ADR-002/);
    assert.match(redisDrift.actualInCode.statement, /No redis package or config detected/);

    // 5. Verify MCP getProjectContext automatically surfaces discrepancies to agents
    const mcpService = new McpMemoryService(tempDir);
    const contextJson = JSON.parse(mcpService.getProjectContext());
    assert.ok(Array.isArray(contextJson.discrepancies));
    assert.equal(contextJson.discrepancies.length, 1);
    assert.equal(contextJson.discrepancies[0].id, 'disc-ADR-002-redis');

    // 6. Verify MCP getTechnicalDecisions also surfaces discrepancies to agents
    const decisionsJson = JSON.parse(mcpService.getTechnicalDecisions());
    assert.ok(Array.isArray(decisionsJson.discrepancies));
    assert.equal(decisionsJson.discrepancies.length, 1);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
