# Project Memory — Agent Guide

> **This is the entry point for AI coding agents working on this repository.**
>
> Before writing, modifying, deleting, or restructuring code, read this file and the referenced project documents.

---

# 1. What This Repository Is

This repository contains **Project Memory** — a portable, persistent memory layer for software projects and AI coding agents.

The core problem:

> Developers should not have to repeatedly explain their project to every AI coding agent they use.

Project Memory allows a project to maintain its own technical context and make that context available through:

- Local CLI
- npm packages
- MCP
- Web application
- Project-specific AI assistant
- Interview simulation

The long-term goal is:

> **Build it. Understand it. Remember it. Explain it. Defend it.**

---

# 2. Required Documents

All project-level instructions and decisions are stored in the same directory as this file.

Before making significant changes, read:

```text
AGENT.md
INSTRUCTIONS.md
DECISIONS.md
IDEA.md
```

## Document responsibilities

### `AGENT.md`

This file.

Defines:

- How an AI coding agent should work
- Which documents to read
- Build order
- Repository workflow
- Development phases
- Guardrails

---

### `INSTRUCTIONS.md`

Defines the **engineering rules**.

It answers:

> "How should I implement things in this repository?"

It contains rules covering:

- Architecture boundaries
- Token efficiency
- Security
- Testing
- Dependencies
- MCP design
- Local-first development
- AI behavior
- Scope control

---

### `DECISIONS.md`

Defines **architectural decisions that have already been made**.

It answers:

> "Why is the project designed this way?"

Do not casually reverse accepted decisions.

If an architectural decision must change, update the decision history instead of silently replacing it.

---

### `IDEA.md`

Defines the **product idea and long-term vision**.

It answers:

> "What are we building and why?"

It contains:

- Problem
- Vision
- Product components
- CLI
- MCP
- npm packages
- Web application
- Interview mode
- Open-source strategy
- Roadmap

---

# 3. Reading Order

Every new coding agent should read the documents in this order:

```text
1. AGENT.md
       ↓
2. IDEA.md
       ↓
3. INSTRUCTIONS.md
       ↓
4. DECISIONS.md
       ↓
5. Repository source code
```

For a small change, the agent may only need the relevant sections.

For architectural work, all four documents must be understood first.

---

# 4. Do Not Start Coding Immediately

Before modifying code, perform a short repository analysis.

Determine:

```text
What currently exists?
What is already implemented?
What is missing?
Which package owns the functionality?
Which architectural decision applies?
What is the smallest correct change?
```

Do not assume the repository is empty unless inspection confirms it.

Do not recreate functionality that already exists.

---

# 5. Build Philosophy

Project Memory should be built **incrementally**.

Do not attempt to implement the complete vision at once.

The initial build should establish the core system first.

Preferred progression:

```text
Core
 ↓
Memory
 ↓
Ingestion
 ↓
Retrieval
 ↓
CLI
 ↓
MCP
 ↓
Web
 ↓
Interview
 ↓
Advanced intelligence
```

Each stage must produce a working system before the next layer is added.

---

# 6. Initial Build Target

The first working version should focus on:

```text
Project
   ↓
Ingestion
   ↓
Structured Memory
   +
Semantic Memory
   ↓
Retrieval
   ↓
Project Questions
```

The initial goal is **not** to build the complete SaaS platform.

The initial goal is to prove:

> Can we create useful, persistent, project-specific memory from a real software project and retrieve the correct context efficiently?

---

# 7. Phase 0 — Repository Foundation

Before implementing AI functionality, establish a clean repository structure.

A target structure may look like:

```text
project-memory/
│
├── AGENT.md
├── IDEA.md
├── INSTRUCTIONS.md
├── DECISIONS.md
├── README.md
├── LICENSE
│
├── packages/
│   ├── core/
│   ├── analyzer/
│   ├── memory/
│   ├── retrieval/
│   ├── interview/
│   ├── prompts/
│   ├── mcp/
│   └── cli/
│
├── apps/
│   └── web/
│
├── tests/
│
├── docs/
│
└── examples/
```

This is a target architecture, not a requirement to create every directory immediately.

**Do not create empty packages just to match the diagram.**

Create a package when there is functionality that belongs there.

---

# 8. Phase 1 — Core Domain

First build the domain layer.

Define concepts such as:

```text
Project
ProjectFile
ProjectVersion
ProjectFact
TechnicalDecision
ArchitectureComponent
ProjectChange
KnowledgeSource
MemoryEntry
```

The core should not depend on:

- Next.js
- React
- MCP
- CLI frameworks
- Cloud infrastructure

The core should remain reusable.

---

# 9. Phase 2 — Project Ingestion

Implement ingestion for the simplest useful inputs first.

Recommended order:

```text
1. Local project directory
2. Markdown / README
3. Text documents
4. Git repository
5. GitHub repository
6. PDF / DOCX
```

Do not implement every input format simultaneously.

The ingestion pipeline should eventually look like:

```text
Input
 ↓
Parser
 ↓
Normalized Project Data
 ↓
Analyzer
 ↓
Memory
```

All ingestion mechanisms should produce a common internal representation.

---

# 10. Phase 3 — Project Analysis

The analyzer should extract useful technical information.

Initial capabilities:

```text
File structure
Technology detection
Dependencies
Important files
Imports
Basic symbols
Configuration
Git history
```

Later:

```text
AST analysis
Dependency graph
Architecture detection
Call relationships
Code/document mismatch
Change impact analysis
```

Do not attempt advanced code intelligence before the basic analyzer is reliable.

---

# 11. Phase 4 — Project Memory

Build two memory layers.

## Structured Memory

Stores deterministic information:

```text
Technology stack
Architecture
Files
Dependencies
Technical decisions
Project metadata
Changes
```

## Semantic Memory

Stores searchable contextual knowledge.

Potential implementation:

```text
PostgreSQL
+
pgvector
```

The exact implementation may evolve, but the architectural principle from `DECISIONS.md` must remain:

> Structured memory + semantic retrieval.

---

# 12. Phase 5 — Retrieval

Implement retrieval before building a sophisticated chatbot.

The retrieval pipeline should look like:

```text
User Question
      ↓
Question Understanding
      ↓
Structured Memory Lookup
      ↓
Semantic Search
      ↓
Relevant Sources
      ↓
Context Assembly
```

Only after retrieval works reliably should the LLM reasoning layer be added.

This allows retrieval quality to be tested independently.

---

# 13. Phase 6 — AI Answering

The AI layer should consume the minimum necessary context.

Preferred:

```text
Question
 ↓
Structured Memory
 ↓
Targeted Retrieval
 ↓
Relevant Context
 ↓
LLM
 ↓
Grounded Answer
```

Not:

```text
Question
 ↓
Entire Repository
 ↓
LLM
```

Track:

- Input tokens
- Output tokens
- Retrieved sources
- Model
- Latency
- Cache hits

where practical.

---

# 14. Phase 7 — CLI

Once the core memory system works, expose it through the CLI.

Initial commands:

```bash
project-memory init
project-memory analyze
project-memory search
project-memory sync
```

Later:

```bash
project-memory explain
project-memory interview
project-memory mcp
```

The CLI must use the core packages.

Do not duplicate core logic inside command handlers.

---

# 15. Phase 8 — MCP

After the local CLI and memory system are stable, expose Project Memory through MCP.

Initial MCP tools should be read-heavy.

Example:

```text
get_project_context()
search_project_memory()
get_architecture()
get_recent_changes()
get_technical_decision()
find_implementation()
```

Later:

```text
record_project_change()
update_project_memory()
```

Write operations require additional authorization and validation.

MCP must remain an adapter around the core.

---

# 16. Phase 9 — Web Application

The web application should be built after the underlying project intelligence works.

The web application should provide:

```text
Project Dashboard
Project Chat
Architecture View
Memory Explorer
Technical Decisions
Interview Mode
Prompt Generator
Project History
```

The web application must consume the same core concepts as the CLI and MCP.

Do not build a separate "web-only" memory system.

---

# 17. Phase 10 — Interview Engine

Once project memory is reliable, build the interview layer.

The interviewer should use actual project knowledge.

Question progression:

```text
Basic
 ↓
Technical
 ↓
Architecture
 ↓
Failure Scenarios
 ↓
Scaling
 ↓
Deep Technical
```

The system should evaluate:

```text
Accuracy
Depth
Specificity
Architecture Understanding
Missing Knowledge
```

Do not turn this into a generic interview-preparation application.

The interview engine exists specifically to help users **understand and defend their own projects**.

---

# 18. Phase 11 — Coding Agent Integration

Once MCP is stable, connect Project Memory to AI coding agents.

The goal:

```text
Project Memory
      ↓
MCP
      ↓
AI Coding Agent
      ↓
Code Changes
      ↓
Git Diff
      ↓
Project Memory Update
```

This creates the continuous project-memory loop.

---

# 19. Build Order Rule

Do not skip directly to advanced features.

The preferred dependency chain is:

```text
Domain                 [x] (packages/core: domain models & knowledge sources)
  ↓
Ingestion              [x] (packages/analyzer: repository crawling & secret screening)
  ↓
Analysis               [x] (packages/analyzer: tech-stack & component detection)
  ↓
Memory                 [x] (packages/core: structured JSON & semantic .md storage)
  ↓
Retrieval              [x] (packages/core: intent classification & context assembly)
  ↓
AI                     [x] (packages/cli/src/ai-engine.ts: Gemini API & Groq with token-free fallback)
  ↓
CLI                    [x] (packages/cli: interactive TUI session, init, analyze, ask, search, status)
  ↓
MCP                    [x] (packages/mcp: stdio transport, read tools & record_technical_decision)
  ↓
Interview              [x] (packages/interview: question gen, rubric evaluator, terminal drill)
  ↓
Web                    [x] (apps/web: Next.js visual dashboard, ADR log, Chat, & Interview)
  ↓
Agent Integration      [x] (MCP auto-setup for Cursor & Antigravity)
```

If a later feature requires a missing foundation, build the foundation first.

---

# 20. Before Adding a New Technology

Ask:

```text
Why do we need it?
What problem does it solve?
Can the current stack solve it?
Does it introduce operational complexity?
Does it affect the core architecture?
Does it increase cost?
Does it affect local-first usage?
```

If the answer is unclear, do not add it yet.

---

# 21. Before Changing Architecture

Read:

```text
INSTRUCTIONS.md
DECISIONS.md
```

Then determine whether an existing decision already covers the proposed change.

If it does:

> Follow the existing decision unless there is a strong reason to supersede it.

If it does not:

> Propose the change before implementing it.

Architectural changes must be documented in `DECISIONS.md`.

---

# 22. Before Installing Dependencies

Check:

```text
package.json
pnpm-lock.yaml / package-lock.json
existing packages
```

first.

Prefer existing dependencies when they are appropriate.

Do not introduce a library for a problem that can be solved with a small amount of existing code.

---

# 23. Before Creating a New Package

Ask:

> Does this functionality have an independent responsibility or reusable boundary?

If not, keep it in the existing package.

Avoid creating:

```text
packages/
├── tiny-helper-a
├── tiny-helper-b
├── tiny-helper-c
```

just to make the repository look modular.

Modularity should represent real boundaries.

---

# 24. Testing Workflow

After implementing a feature:

```text
1. Typecheck
2. Lint
3. Unit tests
4. Integration tests
5. Relevant manual test
```

For core memory functionality, test:

```text
Ingestion
Memory creation
Memory updates
Retrieval
Source attribution
Conflict handling
```

For MCP:

```text
Tool schemas
Tool responses
Error handling
Authorization
```

For CLI:

```text
Commands
Arguments
Errors
Exit codes
```

---

# 25. Security Workflow

Before accepting repository data:

```text
Scan
 ↓
Detect secrets
 ↓
Exclude secrets
 ↓
Analyze safe content
 ↓
Store memory
```

Never assume user repositories are safe.

Never execute arbitrary repository code by default.

---

# 26. Token & Cost Workflow

Every AI feature should answer:

```text
What context is being sent?
Why is that context necessary?
Can structured memory answer this?
Can retrieval reduce the context?
Can the result be cached?
Can a smaller model perform this step?
```

Token efficiency is part of the architecture.

---

# 27. Error Handling

Do not hide failures.

Prefer explicit errors:

```text
Project not initialized.
Memory index unavailable.
Repository could not be parsed.
No relevant project knowledge found.
AI provider unavailable.
```

Do not return fabricated answers when retrieval fails.

If evidence is unavailable:

> "I couldn't find enough project evidence to answer this reliably."

---

# 28. Git Workflow

Use Git history as part of project intelligence where useful.

Do not modify or rewrite user history automatically.

Memory updates should be derived from:

```text
Commits
Diffs
Changed files
```

where appropriate.

---

# 29. Agent Communication Style

When working autonomously, the coding agent should communicate:

```text
What I found
What I am changing
Why I am changing it
What files are affected
What I tested
```

Do not provide long explanations for trivial changes.

For architectural changes, provide a concise rationale.

---

# 30. Never Do These Things Without Explicit Approval

Do not:

- Rewrite the entire codebase
- Replace the database
- Replace the framework
- Introduce microservices
- Add Kubernetes
- Change the core memory model
- Remove an accepted architecture decision
- Add multiple LLM providers
- Add arbitrary code execution
- Upload project source code to a third party
- Delete user data
- Remove tests to make builds pass

without first establishing a clear technical reason and following the decision process.

---

# 31. When the Agent Gets Stuck

Do not solve uncertainty by adding complexity.

Instead:

```text
1. Re-read the relevant instructions.
2. Inspect existing code.
3. Check DECISIONS.md.
4. Check tests.
5. Identify the smallest missing piece.
6. Implement that piece.
```

If the problem requires changing an accepted architectural decision, stop and document the proposed change.

---

# 32. Definition of a Successful Build

The project is successful when a developer can:

```text
1. Initialize Project Memory in a repository.

2. Analyze the repository.

3. Generate persistent project knowledge.

4. Ask technical questions about the project.

5. Retrieve accurate, source-grounded answers.

6. Keep the memory updated as the project changes.

7. Start the local MCP server.

8. Connect an AI coding agent to Project Memory.

9. Switch coding agents without losing project context.

10. Use the same project knowledge through the web application.
```

---

# 33. The Central Principle

Every implementation decision should support this loop:

```text
              ┌─────────────────────┐
              │     PROJECT CODE    │
              └──────────┬──────────┘
                         │
                         ▼
                 PROJECT MEMORY
                         │
                         ▼
                    AI AGENT
                         │
                         ▼
                    CODE CHANGE
                         │
                         ▼
                    GIT DIFF
                         │
                         └──────────────┐
                                        │
                                        ▼
                                UPDATED MEMORY
```

The project continuously remembers what happened.

---

# 34. Final Instruction to Coding Agents

Before writing code, remember:

> **You are not building a generic chatbot.**

You are building a **portable project memory infrastructure layer**.

The core priorities are:

```text
1. Correctness
2. Source-grounded knowledge
3. Portability
4. Local-first operation
5. Token efficiency
6. Security
7. Modularity
8. Interoperability
9. Simplicity
```

When there are multiple technically valid solutions, prefer the one that keeps Project Memory:

> **simple, portable, local, source-grounded, token-efficient, and accessible to multiple AI agents.**

And always remember:

```text
IDEA.md
    → Why are we building this?

INSTRUCTIONS.md
    → How should we build it?

DECISIONS.md
    → Why did we choose this architecture?

AGENT.md
    → How should an AI coding agent operate in this repository?
```

**Read them. Follow them. Do not casually override them.**