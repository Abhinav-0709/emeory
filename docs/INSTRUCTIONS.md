# Project Memory — Engineering Instructions

> This document defines how AI coding agents must work on Project Memory.
>
> **Read this before making any architectural, dependency, or structural change.**

---

# 1. Project Identity

Project Memory is a **portable, persistent project-context layer for software projects and AI coding agents**.

The core idea:

> The project should carry its own memory so developers can switch between AI coding agents without losing technical context.

The project is composed of:

```text
Project Memory
│
├── Core Intelligence
├── Project Analyzer
├── Memory Engine
├── CLI
├── MCP Server
└── Web Application
```

---

# 2. Primary Engineering Goal

Build a system that is:

- Local-first
- Portable
- Agent-agnostic
- Token-efficient
- Source-grounded
- Incrementally updatable
- Secure
- Modular
- Open-source friendly

Do not sacrifice these principles for short-term implementation convenience.

---

# 3. Core Rule

## Do not turn Project Memory into a generic RAG chatbot.

The system must maintain **structured project memory** in addition to semantic/vector retrieval.

Use:

```text
Structured Memory
+
Semantic Retrieval
+
Source References
+
LLM Reasoning
```

Do not use:

```text
Everything → embeddings → LLM
```

as the primary architecture.

---

# 4. Source of Truth

When determining what a project actually does, prefer sources in this order:

```text
1. Current source code
2. Tests
3. Configuration
4. Git history
5. Documentation
6. User-provided project report
7. AI-generated assumptions
```

AI-generated assumptions must never silently become project facts.

If sources disagree, preserve the disagreement and surface it.

Example:

```text
⚠️ Documentation says Redis is used for caching.

Current implementation shows Redis being used primarily
for background job coordination.
```

Do not silently overwrite either source.

---

# 5. Architecture Boundaries

Keep these responsibilities separate.

## Core

Responsible for:

- Project memory
- Domain models
- Retrieval interfaces
- Project knowledge
- Shared business logic

The core must not depend on the web application.

---

## Analyzer

Responsible for:

- Repository analysis
- File analysis
- Dependency extraction
- AST analysis
- Architecture detection
- Git analysis

The analyzer produces information consumed by the memory engine.

---

## Memory Engine

Responsible for:

- Structured memory
- Semantic memory
- Retrieval
- Updating memory
- Versioning

It should not contain UI-specific logic.

---

## CLI

Responsible for:

- Local developer experience
- Project initialization
- Local analysis
- Synchronization
- Search
- MCP startup

The CLI should call the core rather than duplicate core logic.

---

## MCP

Responsible for:

- Exposing Project Memory to AI agents
- Tool definitions
- MCP transport
- Agent-facing schemas

MCP must be an adapter around the core.

Do not put business logic directly inside MCP tool implementations.

---

## Web

Responsible for:

- User interface
- Authentication
- Project management
- Chat
- Interview experience
- Visualization
- Cloud functionality

The web application must not become the only way to use Project Memory.

---

# 6. Dependency Direction

Prefer this dependency direction:

```text
Web ───────────────┐
CLI ───────────────┤
MCP ───────────────┤
                   ▼
                 Core
                   ▲
                   │
                Analyzer
```

Avoid:

```text
Core → Web
Core → CLI
Core → MCP
```

The core must remain reusable.

---

# 7. Local-First Principle

The CLI must be able to operate without requiring the hosted web application.

The user should be able to:

```bash
project-memory init
project-memory analyze
project-memory search
project-memory sync
project-memory mcp
```

locally.

Project Memory must not force users to upload their source code to a cloud service.

---

# 8. Token Efficiency

Token usage is a first-class engineering concern.

Never send the entire project to an LLM unless explicitly required.

Prefer:

```text
Question
 ↓
Intent
 ↓
Structured Memory
 ↓
Targeted Retrieval
 ↓
Relevant Context
 ↓
LLM
```

Use:

- Query classification
- Retrieval filtering
- Reranking
- Context compression
- Caching
- Incremental indexing
- Model routing

Track token usage wherever possible.

---

# 9. Incremental Processing

Do not reprocess an entire repository when only a small part changed.

Prefer:

```text
Git diff
 ↓
Changed files
 ↓
Affected knowledge
 ↓
Update only affected memory
```

Example:

If `src/auth.ts` changes, do not automatically re-index the entire repository.

---

# 10. Memory Design

Project Memory should distinguish:

### Facts

```text
Database = PostgreSQL
```

### Decisions

```text
PostgreSQL was selected because...
```

### Implementation

```text
src/db/connection.ts
```

### History

```text
Redis was introduced in commit X.
```

### Inference

```text
The system appears to use Redis for...
```

Never mix these categories without labeling them.

---

# 11. AI Behavior

The AI must:

- Ground answers in project sources
- Mention uncertainty
- Avoid inventing project details
- Prefer current implementation
- Cite relevant files where possible
- Distinguish facts from inference
- Ask for clarification when evidence is insufficient

Bad:

> "Your application uses Redis for caching."

when the evidence is unclear.

Good:

> "The current implementation appears to use Redis primarily for job coordination. I found this in `queue/worker.ts`."

---

# 12. MCP Tool Design

MCP tools must be:

- Small
- Specific
- Descriptive
- Strongly typed
- Safe
- Read-only by default

Prefer:

```text
get_architecture()
search_project_memory()
get_recent_changes()
find_implementation()
```

Avoid:

```text
do_everything()
execute_anything()
run_project_command()
```

Tools should expose capabilities, not arbitrary execution.

---

# 13. Security Rules

Never blindly process:

```text
.env
.env.*
credentials
private keys
SSH keys
cloud credentials
API keys
tokens
secrets
```

Implement secret detection before indexing repository contents.

Never store secrets in vector memory.

Never expose secrets through MCP.

Never execute arbitrary project code without explicit authorization and sandboxing.

---

# 14. Database Rules

Use PostgreSQL as the primary persistent database.

Use vector capabilities through PostgreSQL/pgvector where appropriate.

Do not introduce another database simply because a tutorial uses it.

Every additional persistence system must have a documented reason.

---

# 15. Caching and Queues

Redis may be used for:

- Background jobs
- Temporary state
- Caching
- Rate limiting

But Redis must not become the source of truth for persistent project memory.

Persistent memory belongs in durable storage.

---

# 16. API Design

Prefer:

- Explicit schemas
- Typed responses
- Versioned APIs where appropriate
- Stable contracts
- Clear errors

Do not introduce breaking API changes without updating:

- Tests
- Documentation
- Consumers
- Decision records

---

# 17. Testing Requirements

Important functionality should have tests.

Prioritize:

```text
Core logic
Memory updates
Retrieval
Analyzer
MCP tools
Security
CLI commands
API contracts
```

Do not rely only on manual testing.

For changes affecting retrieval or memory:

```text
Before
After
Expected behavior
```

should be validated.

---

# 18. Documentation Requirements

Any major architectural change must update the relevant documentation.

At minimum consider:

```text
README.md
INSTRUCTIONS.md
DECISIONS.md
architecture documentation
package documentation
```

Do not allow implementation and documentation to drift.

---

# 19. Dependency Discipline

Before adding a dependency:

1. Check whether existing dependencies already solve the problem.
2. Check maintenance status.
3. Check bundle/runtime impact.
4. Check security implications.
5. Check licensing.
6. Prefer mature, focused libraries.

Do not add a dependency for trivial functionality.

---

# 20. No Premature Complexity

Do not introduce:

- Microservices
- Kubernetes
- Event buses
- Complex agent orchestration
- Multiple vector databases
- Multiple LLM providers
- Distributed infrastructure

unless there is a demonstrated requirement.

Start modular.

Scale only when necessary.

---

# 21. AI Agent Workflow

Before modifying code:

```text
1. Understand the repository.
2. Read relevant instructions.
3. Read DECISIONS.md.
4. Inspect existing implementation.
5. Identify affected modules.
6. Determine whether an existing decision applies.
7. Make the smallest correct change.
8. Run relevant tests.
9. Update documentation if necessary.
10. Update DECISIONS.md for architectural changes.
```

Never immediately rewrite an existing subsystem without understanding it.

---

# 22. Change Classification

Every proposed change should be classified as:

### Small

Examples:

- Bug fix
- UI adjustment
- Refactor without behavior change

No decision record required.

### Medium

Examples:

- New module
- New package
- New retrieval strategy

Review existing architecture before implementation.

### Architectural

Examples:

- Database change
- Memory model change
- MCP protocol strategy
- Core API change
- New infrastructure
- Major AI architecture change

Must update `DECISIONS.md`.

---

# 23. Avoid Scope Explosion

The current core vision is:

```text
Project Memory
+
CLI
+
MCP
+
Web
+
Interview Intelligence
```

Do not automatically add:

```text
Voice assistant
Mobile app
Social network
Full autonomous coding agent
Enterprise collaboration
Marketplace
```

unless explicitly approved.

---

# 24. Definition of Done

A feature is not complete merely because the code runs.

A meaningful feature should have:

```text
Implementation
+
Tests
+
Error handling
+
Documentation
+
Security consideration
+
Token/cost consideration
```

where applicable.

---

# 25. Final Rule

When uncertain, optimize for:

> **Simple architecture + strong boundaries + local ownership + source-grounded intelligence + interoperability.**

Do not optimize for:

> **Maximum features + maximum abstraction + maximum infrastructure.**

Project Memory should remain understandable enough that another developer can read the repository and understand why it works.