import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { LocalStructuredMemoryStore } from '../packages/core/dist/storage/local-fs.js';
import { McpMemoryService } from '../packages/mcp/dist/mcp-service.js';

test('Risk #8: Agent trust boundary on record_technical_decision', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emeory-test-trust-'));

  try {
    const store = new LocalStructuredMemoryStore({ projectRoot: tempDir });
    store.initialize({ name: 'trust-test-app', version: '1.0.0', rootPath: tempDir });

    const mcpService = new McpMemoryService(tempDir);

    // AI agent calls write tool without specifying status
    const result = mcpService.recordTechnicalDecision(
      'Migrate to GraphQL',
      'Need flexible client queries',
      'Replace REST with Apollo GraphQL server',
      'Reduces over-fetching'
    );

    const parsedResult = JSON.parse(result);
    assert.equal(parsedResult.success, true);
    assert.equal(parsedResult.decision.status, 'proposed', 'AI-created ADR must default to proposed status');

    // Query decisions via MCP
    const decisionsResponse = JSON.parse(mcpService.getTechnicalDecisions());
    assert.equal(decisionsResponse.decisions.length, 1);
    const recordedDecision = decisionsResponse.decisions[0];

    assert.equal(recordedDecision.status, 'proposed');
    assert.equal(recordedDecision.isAgentProposed, true, 'isAgentProposed flag must be true for human review');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
