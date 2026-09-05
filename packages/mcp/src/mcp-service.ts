import {
  LocalStructuredMemoryStore,
  LocalSemanticMemoryStore,
  MemoryRetriever,
  type StructuredMemoryState,
  type TechnicalDecision,
  type ArchitectureComponent,
} from '@project-memory/core';

export class McpMemoryService {
  private projectRoot: string;
  private structuredStore: LocalStructuredMemoryStore;
  private semanticStore: LocalSemanticMemoryStore;
  private retriever: MemoryRetriever;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.structuredStore = new LocalStructuredMemoryStore({ projectRoot });
    this.semanticStore = new LocalSemanticMemoryStore(projectRoot);
    this.retriever = new MemoryRetriever(projectRoot);
  }

  /**
   * Tool: get_project_context
   * Returns top-level project identity, tech stack, and module overview
   */
  public getProjectContext(): string {
    const state = this.structuredStore.readState();
    if (!state) {
      return JSON.stringify({
        status: 'uninitialized',
        message: 'Project Memory has not been initialized. Run "project-memory analyze" first.',
      });
    }

    return JSON.stringify(
      {
        project: state.identity.name,
        version: state.identity.version,
        description: state.identity.description,
        techStack: state.techStack.map((t) => ({
          name: t.name,
          category: t.category,
          version: t.version,
          source: t.source.reference,
        })),
        components: state.components.map((c) => ({
          name: c.name,
          type: c.type,
          description: c.description,
          entrypoints: c.entrypoints,
          dependencies: c.dependencies,
        })),
        totalDecisionsRecorded: state.decisions.length,
        discrepancies: state.discrepancies ?? [],
      },
      null,
      2
    );
  }

  /**
   * Tool: search_project_memory
   * Token-efficient query retrieval across structured and semantic knowledge
   */
  public searchProjectMemory(query: string): string {
    const context = this.retriever.retrieve(query);
    return JSON.stringify(
      {
        query,
        classifiedIntent: context.intent,
        directAnswer: context.directAnswer,
        structuredFacts: context.structuredFacts,
        semanticKnowledge: context.semanticChunks.map((c) => ({
          title: c.title,
          category: c.category,
          tags: c.tags,
          content: c.content,
        })),
        assembledSummary: context.assembledSummary,
      },
      null,
      2
    );
  }

  /**
   * Tool: get_architecture
   * Detailed architecture component hierarchy, entrypoints, and dependencies
   */
  public getArchitecture(): string {
    const state = this.structuredStore.readState();
    if (!state) {
      return JSON.stringify({ error: 'Memory not initialized' });
    }

    return JSON.stringify(
      {
        components: state.components,
        discrepancies: state.discrepancies,
      },
      null,
      2
    );
  }

  /**
   * Tool: get_technical_decisions
   * Returns list of recorded ADRs and rationale
   */
  public getTechnicalDecisions(): string {
    const state = this.structuredStore.readState();
    if (!state) {
      return JSON.stringify({ error: 'Memory not initialized' });
    }

    return JSON.stringify(
      {
        decisions: state.decisions.map((d) => ({
          ...d,
          isAgentProposed: d.source.type === 'ai-inference' && d.status === 'proposed',
        })),
        discrepancies: state.discrepancies,
      },
      null,
      2
    );
  }

  /**
   * Tool: get_project_conventions
   * Coding rules and constraints detected for the codebase
   */
  public getProjectConventions(): string {
    const state = this.structuredStore.readState();
    if (!state) {
      return JSON.stringify({ error: 'Memory not initialized' });
    }

    return JSON.stringify(state.conventions, null, 2);
  }

  /**
   * Tool: record_technical_decision (Write tool - ADR-017)
   * Records a technical decision or ADR from an AI agent or developer.
   * Default status is 'proposed' so humans maintain review authority.
   */
  public recordTechnicalDecision(
    title: string,
    context: string,
    decision: string,
    rationale: string,
    status: 'proposed' | 'accepted' = 'proposed'
  ): string {
    const state = this.structuredStore.readState();
    if (!state) {
      return JSON.stringify({ error: 'Memory not initialized. Run "project-memory init" first.' });
    }

    const nextId = `ADR-${String(state.decisions.length + 1).padStart(3, '0')}`;
    const newDecision: TechnicalDecision = {
      id: nextId,
      title,
      status,
      context,
      decision,
      rationale,
      date: new Date().toISOString(),
      source: {
        type: 'ai-inference',
        reference: 'mcp:record_technical_decision',
      },
    };

    state.decisions.push(newDecision);
    this.structuredStore.saveState(state);

    this.semanticStore.saveChunk({
      id: nextId,
      title,
      content: `# Decision: ${title}\n\n**Status**: ${status}\n**Context**: ${context}\n**Decision**: ${decision}\n**Rationale**: ${rationale}\n`,
      category: 'decision',
      tags: ['decision', 'architecture', 'adr'],
      sources: [newDecision.source],
      updatedAt: newDecision.date || new Date().toISOString(),
    });

    return JSON.stringify(
      {
        success: true,
        message: `Recorded decision ${nextId}: "${title}"`,
        decision: newDecision,
      },
      null,
      2
    );
  }
}
