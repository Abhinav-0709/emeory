import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  StructuredMemoryState,
  QueryIntent,
  SemanticMemoryChunk,
  TechStackFact,
  ArchitectureComponent,
  TechnicalDecision,
  ProjectConvention,
} from '../types/index.js';
import { LocalStructuredMemoryStore } from '../storage/local-fs.js';
import { LocalSemanticMemoryStore, type SearchResult } from '../storage/semantic-fs.js';

export interface RetrievedContext {
  intent: QueryIntent;
  directAnswer?: string;
  structuredFacts: {
    techStack?: TechStackFact[];
    components?: ArchitectureComponent[];
    decisions?: TechnicalDecision[];
    conventions?: ProjectConvention[];
  };
  semanticChunks: SemanticMemoryChunk[];
  assembledSummary: string;
}

const COMMON_STOP_WORDS = new Set([
  'what', 'are', 'the', 'is', 'it', 'in', 'on', 'of', 'to', 'for', 'with', 'about',
  'this', 'that', 'these', 'those', 'we', 'you', 'i', 'our', 'your', 'my', 'project',
  'code', 'codebase', 'repo', 'repository', 'app', 'application', 'tell', 'me', 'show',
  'list', 'get', 'give', 'any', 'all', 'do', 'did', 'does', 'have', 'has', 'had',
  'can', 'could', 'would', 'should', 'remember', 'know', 'think', 'things', 'taken',
  'take', 'made', 'make', 'used', 'use', 'using', 'which', 'how', 'there',
]);

const IGNORED_SCAN_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.turbo', 'coverage', '.emeory', '.project-memory',
]);

function findMatchingCodeFiles(projectRoot: string, searchTerms: string[], maxResults = 8): string[] {
  const matches: string[] = [];
  const normalizedTerms = searchTerms.map((t) => t.toLowerCase());

  function walk(dir: string) {
    if (matches.length >= maxResults) return;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (matches.length >= maxResults) break;

      if (entry.isDirectory()) {
        if (!IGNORED_SCAN_DIRS.has(entry.name)) {
          walk(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
        const lowerRel = relPath.toLowerCase();

        const isMatch = normalizedTerms.some((term) => lowerRel.includes(term));
        if (isMatch) {
          matches.push(relPath);
        }
      }
    }
  }

  walk(projectRoot);
  return matches;
}

export class MemoryRetriever {
  private projectRoot: string;
  private structuredStore: LocalStructuredMemoryStore;
  private semanticStore: LocalSemanticMemoryStore;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.structuredStore = new LocalStructuredMemoryStore({ projectRoot });
    this.semanticStore = new LocalSemanticMemoryStore(projectRoot);
  }

  /**
   * Classify user query intent deterministically for accurate offline retrieval
   */
  public classifyIntent(query: string): QueryIntent {
    const q = query.toLowerCase();

    // 0. Features & Capabilities
    if (
      q.includes('feature') ||
      q.includes('featue') ||
      q.includes('capability') ||
      q.includes('capabilities') ||
      q.includes('what can it do') ||
      q.includes('what does it do') ||
      q.includes('what does this project do') ||
      q.includes('what can this project do') ||
      q.includes('highlights') ||
      q.includes('what is this project used for')
    ) {
      return 'feature_query';
    }

    // 1. Technical Decisions / ADRs
    if (
      q.includes('decision') ||
      q.includes('decide') ||
      q.includes('adr') ||
      q.includes('why did') ||
      q.includes('why do') ||
      q.includes('why was') ||
      q.includes('why choose') ||
      q.includes('tradeoff')
    ) {
      return 'decision_query';
    }

    // 2. Conventions & Coding Rules
    if (
      q.includes('convention') ||
      q.includes('rule') ||
      q.includes('guideline') ||
      q.includes('standard') ||
      q.includes('code style') ||
      q.includes('coding style') ||
      q.includes('pattern') ||
      q.includes('best practice')
    ) {
      return 'convention_query';
    }

    // 3. Code Location (where is X, which file handles Y)
    if (
      q.includes('where is') ||
      q.includes('which file') ||
      q.includes('find file') ||
      q.includes('find code') ||
      q.includes('where does') ||
      q.includes('file for') ||
      q.includes('location of') ||
      q.includes('entrypoint') ||
      q.includes('where are')
    ) {
      return 'code_location';
    }

    // 4. Technology Stack & Dependencies (including database, supabase, tailwind, etc.)
    if (
      q.includes('database') ||
      q.includes('what db') ||
      q.includes('which db') ||
      q.includes('is db') ||
      /\bdb\b/.test(q) ||
      q.includes('framework') ||
      q.includes('stack') ||
      q.includes('technology') ||
      q.includes('language') ||
      q.includes('dependencies') ||
      q.includes('libraries') ||
      q.includes('runtime') ||
      q.includes('tools') ||
      q.includes('is supabase') ||
      q.includes('is sqlite') ||
      q.includes('is postgres') ||
      q.includes('is redis') ||
      q.includes('is mongo') ||
      q.includes('is firebase') ||
      q.includes('is tailwind') ||
      q.includes('is docker') ||
      q.includes('is groq') ||
      q.includes('is gemini') ||
      q.includes('is prisma') ||
      q.includes('is drizzle') ||
      q.includes('does it use') ||
      q.includes('do we use') ||
      q.includes('what orm') ||
      q.includes('what auth')
    ) {
      return 'fact_lookup';
    }

    // 5. Architecture & Structure
    if (
      q.includes('architecture') ||
      q.includes('component') ||
      q.includes('module') ||
      q.includes('structure') ||
      q.includes('layout') ||
      q.includes('how does') ||
      q.includes('communicate') ||
      q.includes('pipeline') ||
      q.includes('workflow')
    ) {
      return 'architecture_query';
    }

    // 6. Failure / Error Scenarios
    if (q.includes('crash') || q.includes('fail') || q.includes('error') || q.includes('retry') || q.includes('timeout')) {
      return 'failure_scenario';
    }

    return 'general_context';
  }

  /**
   * Retrieve minimal, token-efficient context grounded in source memory
   */
  public retrieve(query: string): RetrievedContext {
    const intent = this.classifyIntent(query);
    const state: StructuredMemoryState | null = this.structuredStore.readState();

    const retrievedFacts: RetrievedContext['structuredFacts'] = {};
    let directAnswer: string | undefined;

    const q = query.toLowerCase();
    const queryTokens = q.split(/\W+/).filter((t) => t.length > 1 && !COMMON_STOP_WORDS.has(t));

    // ── 1. Tech Stack / Fact Lookup ─────────────────────────────────────────
    if (intent === 'fact_lookup' && state) {
      const isDbQuery = q.includes('database') || /\bdb\b/.test(q);
      const isAuthQuery = q.includes('auth') || q.includes('login') || q.includes('session');
      const isAiQuery = q.includes('ai') || q.includes('llm') || q.includes('groq') || q.includes('gemini') || q.includes('openai');

      if (isDbQuery) {
        const dbs = state.techStack.filter((t) => t.category === 'database');
        if (dbs.length > 0) {
          directAnswer = `Database: ${dbs.map((d) => `${d.name}${d.version ? ` v${d.version}` : ''} (detected via ${d.source.reference})`).join(', ')}`;
        } else {
          directAnswer = `Database: No database detected in project configuration files.\nChecked dependencies for: PostgreSQL, SQLite, MySQL, MongoDB, Supabase, Redis, Firebase.`;
        }
        retrievedFacts.techStack = dbs;
      } else if (isAuthQuery) {
        const auths = state.techStack.filter((t) => t.category === 'auth');
        if (auths.length > 0) {
          directAnswer = `Authentication: ${auths.map((a) => `${a.name}${a.version ? ` v${a.version}` : ''} (via ${a.source.reference})`).join(', ')}`;
        } else {
          directAnswer = `Authentication: No third-party auth libraries detected in package manifests.\nChecked for: NextAuth.js, Clerk, Lucia, Passport, Supabase Auth.`;
        }
        retrievedFacts.techStack = auths;
      } else if (isAiQuery) {
        const ais = state.techStack.filter((t) => t.category === 'ai');
        if (ais.length > 0) {
          directAnswer = `AI / LLM Providers: ${ais.map((a) => `${a.name}${a.version ? ` v${a.version}` : ''} (via ${a.source.reference})`).join(', ')}`;
        } else {
          directAnswer = `AI Providers: No AI SDKs detected in dependencies.`;
        }
        retrievedFacts.techStack = ais;
      } else if (q.includes('framework')) {
        const fws = state.techStack.filter((t) => t.category === 'framework');
        if (fws.length > 0) {
          directAnswer = `Framework(s): ${fws.map((f) => `${f.name}${f.version ? ` v${f.version}` : ''} (${f.source.reference})`).join(', ')}`;
        } else {
          directAnswer = `Framework: No major application framework detected.`;
        }
        retrievedFacts.techStack = fws;
      } else if (q.includes('language') || q.includes('runtime')) {
        const langs = state.techStack.filter((t) => t.category === 'language' || t.category === 'runtime');
        if (langs.length > 0) {
          directAnswer = `Language / Runtime: ${langs.map((l) => `${l.name} (${l.category})`).join(', ')}`;
        }
        retrievedFacts.techStack = langs;
      } else {
        const isVerificationQuery = q.startsWith('is ') || q.startsWith('does ') || q.startsWith('do ') || q.includes(' use ') || q.includes(' used');
        const isBroadStackQuery = q.includes('stack') || q.includes('technologies') || q.includes('all dependencies') || q.includes('what tech') || q.includes('show stack');

        if (isBroadStackQuery && !isVerificationQuery) {
          retrievedFacts.techStack = state.techStack;
          if (state.techStack.length > 0) {
            const lines = ['Project Tech Stack:'];
            for (const item of state.techStack) {
              lines.push(`• ${item.name} (${item.category})${item.version ? ` v${item.version}` : ''} — detected via ${item.source.reference}`);
            }
            directAnswer = lines.join('\n');
          } else {
            directAnswer = 'No tech stack items recorded yet. Run "emeory sync" to scan the repository.';
          }
        } else {
          // Specific library verification (e.g., "is supabase used", "is tailwind used", "does it use redis")
          const targetWord = queryTokens.find((t) =>
            !['database', 'framework', 'library', 'libraries', 'stack', 'tech', 'technologies', 'tool', 'tools', 'project'].includes(t)
          );

          if (targetWord) {
            const matched = state.techStack.filter(
              (t) => t.name.toLowerCase().includes(targetWord) || (t.version && t.version.toLowerCase().includes(targetWord))
            );
            if (matched.length > 0) {
              directAnswer = matched
                .map((m) => `• ${m.name}: Yes, detected in project (${m.category}).\n  Source: ${m.source.reference}${m.version ? ` (v${m.version})` : ''}`)
                .join('\n');
              retrievedFacts.techStack = matched;
            } else {
              directAnswer = `• ${targetWord}: No evidence found in project dependencies or configuration files.`;
            }
          } else {
            // Fallback broad tech stack query
            retrievedFacts.techStack = state.techStack;
            if (state.techStack.length > 0) {
              const lines = ['Project Tech Stack:'];
              for (const item of state.techStack) {
                lines.push(`• ${item.name} (${item.category})${item.version ? ` v${item.version}` : ''} — detected via ${item.source.reference}`);
              }
              directAnswer = lines.join('\n');
            } else {
              directAnswer = 'No tech stack items recorded yet. Run "emeory sync" to scan the repository.';
            }
          }
        }
      }
    }

    // ── 2. Code Location Query ──────────────────────────────────────────────
    if (intent === 'code_location' && state) {
      // Filter query tokens down to search terms
      const locationStopWords = new Set(['where', 'which', 'file', 'files', 'logic', 'code', 'handling', 'located', 'find', 'location', 'path', 'entrypoint']);
      const searchTerms = queryTokens.filter((t) => !locationStopWords.has(t));

      // Special case: entrypoint query
      if (q.includes('entrypoint') || q.includes('entry point') || q.includes('main')) {
        const entrypointLines: string[] = [];
        for (const comp of state.components) {
          if (comp.entrypoints && comp.entrypoints.length > 0) {
            entrypointLines.push(`• ${comp.name}: ${comp.entrypoints.join(', ')}`);
          }
        }
        if (entrypointLines.length > 0) {
          directAnswer = `Project Entrypoints:\n${entrypointLines.join('\n')}`;
        }
      }

      if (!directAnswer) {
        if (searchTerms.length === 0) {
          directAnswer = 'Please specify what component, module, or logic you are looking for (e.g. "where is the auth logic", "where is the cli entrypoint").';
        } else {
          const matchingFiles = findMatchingCodeFiles(this.projectRoot, searchTerms, 8);
          if (matchingFiles.length > 0) {
            const lines = [`Matching files found in codebase (${matchingFiles.length}):`];
            for (const file of matchingFiles) {
              lines.push(`• ${file}`);
            }
            directAnswer = lines.join('\n');
          } else {
            directAnswer = `No files matching "${searchTerms.join(', ')}" were found in the scanned codebase.`;
          }
        }
      }
    }

    // ── 3. Decision Query ───────────────────────────────────────────────────
    if (intent === 'decision_query' && state) {
      if (!state.decisions || state.decisions.length === 0) {
        directAnswer = 'No technical decisions have been recorded yet in this project.\n\nTo record one, run:\n  emeory add "Decision Title" "Rationale / Context" --type decision';
      } else {
        const isGeneral = queryTokens.length === 0 || queryTokens.every((t) => ['decision', 'decisions', 'adr'].includes(t));
        const matched = isGeneral
          ? state.decisions
          : state.decisions.filter((d) =>
              queryTokens.some(
                (w) =>
                  d.title.toLowerCase().includes(w) ||
                  d.decision.toLowerCase().includes(w) ||
                  d.rationale.toLowerCase().includes(w) ||
                  d.context.toLowerCase().includes(w)
              )
            );

        retrievedFacts.decisions = matched.length > 0 ? matched : state.decisions;

        const lines = [`Recorded Technical Decisions (${retrievedFacts.decisions.length}):`];
        for (const d of retrievedFacts.decisions) {
          lines.push(`• [${d.id}] ${d.title} (${d.status.toUpperCase()})`);
          if (d.rationale && d.rationale !== 'N/A') {
            lines.push(`  Rationale: ${d.rationale}`);
          }
          if (d.context && d.context !== d.title && d.context !== d.rationale) {
            lines.push(`  Context: ${d.context}`);
          }
        }
        directAnswer = lines.join('\n');
      }
    }

    // ── 4. Architecture Query ───────────────────────────────────────────────
    if (intent === 'architecture_query' && state) {
      if (!state.components || state.components.length === 0) {
        directAnswer = 'No architectural components detected yet. Run "emeory sync" to scan directory layout.';
      } else {
        const isGeneral =
          queryTokens.length === 0 ||
          queryTokens.every((t) => ['architecture', 'component', 'components', 'module', 'modules', 'structure'].includes(t));

        const matched = isGeneral
          ? state.components
          : state.components.filter((c) =>
              queryTokens.some(
                (w) => c.name.toLowerCase().includes(w) || c.description.toLowerCase().includes(w) || c.type.toLowerCase().includes(w)
              )
            );

        retrievedFacts.components = matched.length > 0 ? matched : state.components;

        const lines = [`Project Architecture (${retrievedFacts.components.length} components):`];
        for (const comp of retrievedFacts.components) {
          lines.push(`• ${comp.name} [${comp.type}] — ${comp.description}`);
          if (comp.entrypoints && comp.entrypoints.length > 0) {
            lines.push(`  Entrypoints: ${comp.entrypoints.join(', ')}`);
          }
          if (comp.dependencies && comp.dependencies.length > 0) {
            lines.push(`  Dependencies: ${comp.dependencies.join(', ')}`);
          }
        }
        directAnswer = lines.join('\n');
      }
    }

    // ── 5. Convention Query ─────────────────────────────────────────────────
    if (intent === 'convention_query' && state) {
      if (!state.conventions || state.conventions.length === 0) {
        directAnswer = 'No conventions or coding rules have been recorded yet.\n\nTo add a convention, run:\n  emeory add "Rule Title" "Rule details" --type context --tags convention';
      } else {
        retrievedFacts.conventions = state.conventions;
        const lines = [`Project Conventions & Standards (${state.conventions.length}):`];
        for (const c of state.conventions) {
          lines.push(`• [${c.category.toUpperCase()}] ${c.rule}`);
          if (c.example) {
            lines.push(`  Example: ${c.example}`);
          }
        }
        directAnswer = lines.join('\n');
      }
    }

    // ── 5.5 Feature & Capabilities Query ──────────────────────────────────
    if (intent === 'feature_query' && state) {
      const allChunks = this.semanticStore.getAllChunks();
      const featureChunk = allChunks.find((c) => c.id === 'project-readme-features' || c.tags.includes('features'));
      const taskChunk = allChunks.find((c) => c.id === 'project-runnable-tasks');

      const lines: string[] = [`Key Features & Capabilities of ${state.identity.name}:`];

      if (featureChunk) {
        lines.push(`\n${cleanChunkContent(featureChunk.content, 1200)}`);
      }

      if (state.components && state.components.length > 0) {
        lines.push('\nCore Modules & Responsibilities:');
        for (const c of state.components) {
          lines.push(`• ${c.name}: ${c.description || (c.responsibilities && c.responsibilities.join(', ')) || 'Module'}`);
        }
      }

      if (taskChunk) {
        lines.push(`\n${taskChunk.content}`);
      }

      if (!featureChunk && (!state.components || state.components.length === 0)) {
        if (state.identity.description) {
          lines.push(`• ${state.identity.description}`);
        }
        lines.push('No detailed feature list recorded. Add features in README.md or record notes with "emeory add".');
      }

      directAnswer = lines.join('\n');
    }

    // ── 6. Project Overview / Broad General Context ─────────────────────────
    if (intent === 'general_context' && state) {
      const isExclusionQuery = q.includes('other than') || q.includes('more than') || q.includes('beyond') || q.includes('detail');
      const allChunks = this.semanticStore.getAllChunks();
      const overviewChunk = allChunks.find((c) => c.id === 'project-readme-overview' || c.tags.includes('overview'));
      const featureChunk = allChunks.find((c) => c.id === 'project-readme-features');

      if (isExclusionQuery) {
        const detailLines: string[] = [`Detailed Context for ${state.identity.name}:`];
        if (overviewChunk) {
          detailLines.push(`\n[Purpose & Background]:\n${cleanChunkContent(overviewChunk.content, 600)}`);
        }
        if (featureChunk) {
          detailLines.push(`\n[Features & Capabilities]:\n${cleanChunkContent(featureChunk.content, 600)}`);
        }
        if (state.components.length > 0) {
          detailLines.push('\n[Components]:');
          for (const c of state.components) {
            detailLines.push(`• ${c.name}: ${c.description || 'Module'} (Entrypoints: ${c.entrypoints?.join(', ') || 'N/A'})`);
          }
        }
        if (state.decisions.length > 0) {
          detailLines.push('\n[Recent Decisions]:');
          for (const d of state.decisions.slice(0, 3)) {
            detailLines.push(`• ${d.title}: ${d.decision}`);
          }
        }
        directAnswer = detailLines.join('\n');
      } else if (q.includes('what') || q.includes('tell') || q.includes('about') || q.includes('remember') || q.includes('overview') || q.includes('summary')) {
        const summaryParts = [`Project: ${state.identity.name} (v${state.identity.version})`];
        if (state.identity.description) {
          summaryParts.push(`Description: ${state.identity.description}`);
        }
        if (overviewChunk && !summaryParts.some((p) => p.includes(overviewChunk.content.slice(0, 40)))) {
          summaryParts.push(`\nAbout:\n${cleanChunkContent(overviewChunk.content, 400)}`);
        }
        if (state.techStack.length > 0) {
          summaryParts.push(`\nTech Stack: ${state.techStack.map((t) => `${t.name} (${t.category})`).join(', ')}`);
        }
        if (state.components.length > 0) {
          summaryParts.push(`Components: ${state.components.map((c) => c.name).join(', ')}`);
        }
        summaryParts.push(`Recorded Memory: ${state.decisions.length} decisions, ${state.notes.length} notes, ${state.conventions.length} conventions`);
        directAnswer = summaryParts.join('\n');
      }
    }

    // ── 7. Semantic Chunks Retrieval (Always populated for rich context) ────
    const allMatches = this.semanticStore.search(query, 4);
    const semanticMatches: SearchResult[] = allMatches.filter((m) => m.score >= 1.5);

    // ── 8. Assembled Output Generation ──────────────────────────────────────
    const summaryLines: string[] = [];

    if (directAnswer) {
      summaryLines.push(directAnswer);
    }

    if (retrievedFacts.techStack && retrievedFacts.techStack.length > 0 && !directAnswer?.includes('Tech Stack:')) {
      summaryLines.push(
        `[Tech Stack]: ${retrievedFacts.techStack.map((t) => `${t.name} (${t.category})`).join(', ')}`
      );
    }

    if (retrievedFacts.decisions && retrievedFacts.decisions.length > 0) {
      for (const d of retrievedFacts.decisions) {
        summaryLines.push(`[Decision ${d.id}]: ${d.title} — Rationale: ${d.rationale}`);
      }
    }

    if (retrievedFacts.components && retrievedFacts.components.length > 0 && !directAnswer?.includes('Components:')) {
      for (const c of retrievedFacts.components) {
        summaryLines.push(`[Component ${c.name}]: ${c.description}`);
      }
    }

    if (semanticMatches.length > 0) {
      for (const res of semanticMatches) {
        const cleanContent = cleanChunkContent(res.chunk.content);
        if (!summaryLines.some((l) => l.includes(cleanContent.slice(0, 50)))) {
          summaryLines.push(`[Knowledge (${res.chunk.title})]:\n${cleanContent}`);
        }
      }
    } else if (!directAnswer) {
      summaryLines.push('No matching context found in project memory for this query.');
    }

    return {
      intent,
      directAnswer,
      structuredFacts: retrievedFacts,
      semanticChunks: semanticMatches.map((m) => m.chunk),
      assembledSummary: summaryLines.join('\n\n'),
    };
  }
}

/**
 * Strips massive badge walls, tables of contents, and truncates giant markdown blobs
 */
function cleanChunkContent(content: string, maxChars = 500): string {
  let text = content.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '');
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  if (text.length > maxChars) {
    return text.slice(0, maxChars).trim() + '\n... [truncated]';
  }
  return text;
}
