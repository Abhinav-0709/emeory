/**
 * Source types prioritized according to ADR-006:
 * 1. source-code
 * 2. test
 * 3. config
 * 4. git-history
 * 5. documentation
 * 6. user-report
 * 7. ai-inference
 */
export type KnowledgeSourceType =
  | 'source-code'
  | 'test'
  | 'config'
  | 'git-history'
  | 'documentation'
  | 'user-report'
  | 'ai-inference';

export interface KnowledgeSource {
  type: KnowledgeSourceType;
  reference: string; // e.g., 'src/queue/worker.ts#L10-L45' or 'docs/README.md'
  timestamp?: string;
}

/**
 * Basic identity of a project
 */
export interface ProjectIdentity {
  name: string;
  version: string;
  description?: string;
  rootPath: string;
  repositoryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Deterministic facts about technology stack
 */
export interface TechStackFact {
  category: 'language' | 'framework' | 'database' | 'queue' | 'orm' | 'tooling' | 'runtime' | 'auth' | 'ai';
  name: string;
  version?: string;
  source: KnowledgeSource;
  confidence: number; // 0.0 to 1.0
}

/**
 * Architecture component
 */
export interface ArchitectureComponent {
  id: string;
  name: string;
  type: 'service' | 'module' | 'database' | 'queue' | 'frontend' | 'gateway' | 'worker';
  description: string;
  entrypoints?: string[];
  responsibilities: string[];
  dependencies: string[]; // references other component IDs
  sources: KnowledgeSource[];
}

/**
 * Structured architectural decision (ADR format)
 */
export interface TechnicalDecision {
  id: string; // e.g. "ADR-001"
  title: string;
  status: 'proposed' | 'accepted' | 'superseded' | 'deprecated';
  context: string;
  decision: string;
  rationale: string;
  alternativesConsidered?: string[];
  date?: string;
  source: KnowledgeSource;
}

/**
 * Coding and architectural conventions detected or set
 */
export interface ProjectConvention {
  id: string;
  category: 'architecture' | 'naming' | 'testing' | 'formatting' | 'error-handling';
  rule: string;
  example?: string;
  source: KnowledgeSource;
}

/**
 * Discrepancy/Conflict preserved according to ADR-007
 */
export interface KnowledgeDiscrepancy {
  id: string;
  topic: string;
  claimedByDoc: {
    statement: string;
    source: KnowledgeSource;
  };
  actualInCode: {
    statement: string;
    source: KnowledgeSource;
  };
  detectedAt: string;
}

/**
 * Manual or AI-recorded project note / context item
 */
export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  source: KnowledgeSource;
}

/**
 * The complete structured memory state (saved to JSON files)
 */
export interface StructuredMemoryState {
  identity: ProjectIdentity;
  techStack: TechStackFact[];
  components: ArchitectureComponent[];
  decisions: TechnicalDecision[];
  notes: ProjectNote[];
  conventions: ProjectConvention[];
  discrepancies: KnowledgeDiscrepancy[];
}

/**
 * Semantic knowledge chunk stored with contextual tags and optional embeddings
 */
export interface SemanticMemoryChunk {
  id: string;
  title: string;
  content: string;
  category: 'architecture' | 'decision' | 'module' | 'workflow' | 'failure-scenario' | 'setup';
  tags: string[];
  sources: KnowledgeSource[];
  embedding?: number[];
  updatedAt: string;
}

/**
 * Query classifications for token-efficient retrieval (ADR-008)
 */
export type QueryIntent =
  | 'fact_lookup'        // Simple factual questions ("What database is used?")
  | 'architecture_query'// Structural questions ("How does worker communicate?")
  | 'decision_query'    // "Why was X chosen?" or "What decisions did we make?"
  | 'convention_query'  // "What conventions or coding rules do we follow?"
  | 'code_location'     // "Where is auth handled?"
  | 'failure_scenario'  // "What happens if queue crashes?"
  | 'general_context';  // General/broad queries
