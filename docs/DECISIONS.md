# Project Memory — Architecture Decisions

> This document records important architectural decisions made for Project Memory.
>
> **AI coding agents must read this before proposing architectural changes.**
>
> Existing decisions should not be casually reversed. If a decision needs to change, explain why and create a new decision record.

---

# ADR-001 — Project Memory is the Core Product

**Status:** Accepted

## Decision

The primary product is not a generic RAG chatbot.

Project Memory is a **portable project-context and memory layer for software projects and AI coding agents**.

The web application, CLI and MCP server are interfaces around the core Project Memory system.

## Why

The long-term value comes from making project knowledge portable across:

- AI coding agents
- Developers
- Interfaces
- Environments

The project should own its memory rather than an individual AI provider.

---

# ADR-002 — Local-First Project Memory

**Status:** Accepted

## Decision

The CLI must support local project memory.

The user should be able to maintain a `.project-memory/` directory inside or alongside their project.

Example:

```text
.project-memory/
├── manifest.json
├── architecture.json
├── decisions.json
├── conventions.json
├── knowledge/
├── history/
└── index/
```

## Why

Developers should not need to upload private source code to a cloud service to use the core product.

It also makes project memory portable across AI providers.

---

# ADR-003 — Project Memory Must Be Agent-Agnostic

**Status:** Accepted

## Decision

Project Memory must not be designed around a single AI coding agent.

It should work with multiple agents through standard interfaces, primarily MCP.

Potential consumers include:

- Claude Code
- Codex
- Cursor
- Antigravity
- Future AI coding agents

## Why

The core problem is **context portability**.

Locking the system to one agent defeats the primary purpose of the project.

---

# ADR-004 — MCP is an Adapter, Not the Core

**Status:** Accepted

## Decision

MCP will expose Project Memory capabilities to AI agents.

The MCP layer must call the core system rather than contain the core business logic.

Architecture:

```text
AI Agent
   ↓
MCP
   ↓
Project Memory Core
   ↓
Memory / Analyzer / Retrieval
```

## Why

This keeps the core reusable by:

- Web
- CLI
- MCP
- Third-party integrations

MCP is the interoperability layer.

---

# ADR-005 — Structured Memory + Semantic Retrieval

**Status:** Accepted

## Decision

Project Memory will use two complementary memory systems:

### Structured memory

For deterministic project facts.

### Semantic/vector memory

For contextual and natural-language retrieval.

Architecture:

```text
                 Project Memory
                       │
              ┌────────┴────────┐
              ▼                 ▼
        Structured          Vector Search
          Memory                 │
              │                 │
              └────────┬────────┘
                       ▼
                    AI Layer
```

## Why

A vector database should not be responsible for every project fact.

Simple questions should be answerable without expensive LLM calls.

---

# ADR-006 — Source Code is the Primary Source of Truth

**Status:** Accepted

## Decision

When documentation and implementation disagree, the current implementation has higher authority.

Priority:

```text
Source Code
    ↓
Tests
    ↓
Configuration
    ↓
Git History
    ↓
Documentation
    ↓
User Report
    ↓
AI Inference
```

## Why

Project Memory exists partly to help developers understand what their project actually does.

The system must not blindly trust outdated reports.

---

# ADR-007 — Preserve Conflicting Knowledge

**Status:** Accepted

## Decision

If project documentation and implementation disagree, Project Memory must preserve the discrepancy instead of silently replacing one source with another.

Example:

```text
Documentation:
Redis is used for caching.

Implementation:
Redis is used for job queues.

Memory:
⚠️ Documentation and implementation disagree.
```

## Why

Conflicts are useful information.

They may indicate:

- outdated documentation
- unfinished refactoring
- misunderstood architecture
- accidental behavior

---

# ADR-008 — Token Efficiency is a Core Requirement

**Status:** Accepted

## Decision

The system must minimize unnecessary LLM context.

The preferred pipeline is:

```text
Question
 ↓
Query classification
 ↓
Structured memory
 ↓
Targeted retrieval
 ↓
Relevant context
 ↓
LLM
```

The entire repository must not be sent to the LLM by default.

## Why

Token usage affects:

- Cost
- Latency
- Context limits
- Scalability
- Agent performance

Token efficiency is part of the product value proposition.

---

# ADR-009 — Incremental Indexing

**Status:** Accepted

## Decision

Project Memory must support incremental updates.

When project files change:

```text
Git diff
 ↓
Changed files
 ↓
Affected knowledge
 ↓
Re-index only affected content
```

## Why

Reprocessing an entire repository for every small change is wasteful.

Incremental indexing improves:

- Speed
- Cost
- Token usage
- Developer experience

---

# ADR-010 — CLI is a First-Class Product Interface

**Status:** Accepted

## Decision

The CLI is not merely a convenience wrapper around the web application.

It must be capable of managing local Project Memory independently.

Example:

```bash
project-memory init
project-memory analyze
project-memory sync
project-memory search
project-memory interview
project-memory mcp
```

## Why

The core problem is developer tooling.

A developer should be able to use Project Memory directly inside a repository.

---

# ADR-011 — npm Ecosystem

**Status:** Accepted

## Decision

The core system should be implemented as reusable packages where practical.

Potential packages:

```text
@project-memory/core
@project-memory/analyzer
@project-memory/mcp
@project-memory/cli
```

## Why

This enables:

- Reuse
- Third-party integrations
- CLI distribution
- MCP distribution
- Community contributions

The web application must not be the only consumer of the system.

---

# ADR-012 — Open Source Core

**Status:** Accepted

## Decision

Project Memory will follow an open-source-first/open-core direction.

The developer infrastructure should be open source.

Potential open-source components:

```text
Core
Analyzer
CLI
MCP
Memory format
Local storage
Basic retrieval
```

Hosted functionality may remain separate.

## Why

The product is fundamentally about interoperability and portability.

An open implementation makes the memory layer more useful to the ecosystem.

---

# ADR-013 — Hosted Cloud is Optional

**Status:** Accepted

## Decision

Cloud functionality must be an extension of Project Memory, not a hard dependency.

Potential cloud features:

```text
Synchronization
Team memory
Collaboration
Backups
Advanced analytics
Hosted AI
Enterprise controls
```

## Why

Users should be able to use the core project locally without depending on the hosted service.

---

# ADR-014 — PostgreSQL as Primary Persistent Database

**Status:** Accepted

## Decision

PostgreSQL is the primary persistent database for the hosted system.

Vector search should preferably use PostgreSQL + pgvector before introducing a separate vector database.

## Why

This keeps the architecture simpler and reduces unnecessary infrastructure.

A separate vector database should only be introduced if there is a demonstrated technical requirement.

---

# ADR-015 — Redis is Not the Source of Truth

**Status:** Accepted

## Decision

Redis may be used for:

- Caching
- Background jobs
- Rate limiting
- Temporary state

Persistent project memory must remain in durable storage.

## Why

Memory must survive:

- Restarts
- Worker failures
- Cache eviction
- Infrastructure changes

---

# ADR-016 — MCP Tools Should Be Narrow and Typed

**Status:** Accepted

## Decision

MCP tools should expose specific capabilities.

Preferred:

```text
get_architecture()
search_project_memory()
get_recent_changes()
find_implementation()
get_technical_decision()
```

Avoid:

```text
execute_anything()
do_everything()
run_arbitrary_command()
```

## Why

Narrow tools are:

- Easier for AI agents to understand
- Easier to secure
- Easier to test
- Easier to observe
- Easier to maintain

---

# ADR-017 — Read-Only by Default

**Status:** Accepted

## Decision

Project Memory MCP tools should be read-only by default.

Write operations require explicit, narrowly scoped capabilities.

Example:

```text
Read:
search_project_memory()

Write:
record_project_change()
```

should remain separate.

## Why

AI agents can make mistakes.

Separating read and write capabilities reduces risk.

---

# ADR-018 — No Arbitrary Code Execution

**Status:** Accepted

## Decision

Project Memory must not expose unrestricted arbitrary code execution through MCP or the web application.

If project code needs to be executed for analysis, it must be:

- Explicit
- Sandboxed
- Resource-limited
- Audited

## Why

Project repositories may contain malicious or unsafe code.

AI-controlled execution is a major security boundary.

---

# ADR-019 — Secrets Must Never Become Project Memory

**Status:** Accepted

## Decision

The ingestion pipeline must detect and exclude secrets.

Potential targets:

```text
.env
API keys
private keys
cloud credentials
tokens
passwords
database credentials
```

## Why

Project Memory may process entire repositories.

Accidentally embedding secrets would create a severe security problem.

---

# ADR-020 — Interview Mode Uses Project-Specific Knowledge

**Status:** Accepted

## Decision

Interview questions should be generated primarily from the user's actual project.

The system should prioritize:

```text
Actual implementation
Architecture
Technical decisions
Known limitations
Project history
```

over generic interview questions.

## Why

The core problem is helping developers confidently explain **their own work**, not teaching generic DSA or CS interview questions.

---

# ADR-021 — Prompt Generation Must Be Architecture-Aware

**Status:** Accepted

## Decision

Coding-agent prompts should contain project-specific context.

Generated tasks should include:

```text
Project Context
Current Architecture
Relevant Files
Task
Constraints
Acceptance Criteria
Tests
```

## Why

Generic prompts cause AI coding agents to make assumptions.

Project Memory should reduce those assumptions.

---

# ADR-022 — No Premature Microservices

**Status:** Accepted

## Decision

The initial system should use a modular architecture rather than distributed microservices.

Start with:

```text
Web
API
Worker
Database
Redis
Core packages
```

Move toward separate services only when real scale or isolation requirements justify it.

## Why

Microservices introduce operational complexity that is unnecessary during the early stages.

---

# ADR-023 — Web, CLI and MCP Share the Same Core

**Status:** Accepted

## Decision

The three primary interfaces should reuse the same underlying Project Memory capabilities.

```text
             Project Memory Core
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
      Web          CLI           MCP
```

## Why

This prevents duplicated business logic and keeps behavior consistent across interfaces.

---

# ADR-024 — Project Memory Must Be Version-Aware

**Status:** Accepted

## Decision

Project Memory should eventually understand project evolution.

Memory should be associated with project versions or meaningful changes.

The system should eventually answer:

> "Why did this architecture change?"

and:

> "What changed between these two project states?"

## Why

A project is not static.

The memory must evolve with it.

---

# ADR-025 — The Memory Format Should Be Portable

**Status:** Accepted

## Decision

The local Project Memory representation should use documented, portable formats where possible.

Avoid locking project memory into a proprietary cloud-only representation.

## Why

The long-term vision is interoperability.

A developer should be able to move their memory between:

- Machines
- AI agents
- Editors
- Hosted services
- Future tools

---

# 26. Decision Change Policy

An accepted architectural decision should not be changed casually.

If a decision needs to change:

1. Explain the problem with the existing decision.
2. Describe the proposed alternative.
3. Explain tradeoffs.
4. Identify affected components.
5. Update the architecture.
6. Add a new decision record.
7. Mark the previous decision as superseded.

Example:

```text
ADR-005
Status: Superseded by ADR-031
```

Do not silently rewrite history.

---

# 27. Current Non-Goals

The following are intentionally outside the current core scope:

- Social network
- Mobile application
- Autonomous general-purpose coding agent
- Voice assistant
- Enterprise collaboration suite
- Marketplace
- Large plugin ecosystem
- Complex multi-agent orchestration
- Kubernetes-first deployment
- Multiple vector databases

These may be considered later but should not influence the current architecture.

---

# 28. Final Architectural Principle

The architecture should always move toward:

```text
Portable
Local-first
Source-grounded
Token-efficient
Agent-agnostic
Secure
Modular
Open
```

The central question behind architectural decisions should be:

> **Does this make project knowledge more portable, reliable, useful, and accessible to both developers and AI agents?**

If not, question whether it belongs in Project Memory.