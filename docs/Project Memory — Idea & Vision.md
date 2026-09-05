# Project Memory

> **Portable, persistent memory for software projects and AI coding agents.**

## 1. The Problem

Developers build projects, but the technical knowledge behind those projects is often temporary.

A student may build a project for a college assignment, hackathon, internship, or portfolio and later struggle to explain:

- Why a particular technology was chosen
- How the architecture works
- Why a database was selected
- How authentication works
- How different services communicate
- Where an important feature is implemented
- What happens when something fails
- Why a particular technical decision was made
- How the project evolved over time

This becomes especially painful during technical interviews.

A developer may have genuinely built a project but still be unable to confidently answer questions about it months later.

There is another related problem with modern AI coding agents.

A developer may work with one coding agent for weeks. That agent gradually builds context about:

- The architecture
- Coding conventions
- Technical decisions
- Important files
- Existing implementations
- Previous changes
- Known limitations

When the developer switches to another coding agent, much of that context disappears.

The new agent starts asking:

> "What does this project do?"

> "Why are you using Redis?"

> "How does authentication work?"

> "Which module handles this?"

The developer either explains everything again or spends large amounts of tokens allowing the new agent to rediscover the project.

---

# 2. The Core Idea

**Project Memory is a portable memory layer for software projects.**

Instead of project knowledge belonging to:

- Claude Code
- Cursor
- Codex
- Antigravity
- A particular ChatGPT conversation
- A particular developer tool

the knowledge belongs to the **project itself**.

The project carries its own technical memory.

```text
                    PROJECT
                       │
                       ▼
                PROJECT MEMORY
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Developers       Web App       AI Agents
                       │              │
                       │             MCP
                       │              │
                       └──────┬───────┘
                              ▼
                       Shared Context
```

The fundamental principle is:

> **Don't make every AI agent relearn the project.**

---

# 3. Product Vision

Project Memory aims to become an **open, portable project-context layer for developers and AI coding agents**.

A project should be able to carry:

- Its architecture
- Its technical decisions
- Its important modules
- Its dependencies
- Its coding conventions
- Its project history
- Its known problems
- Its implementation knowledge
- Its documentation
- Its interview knowledge

and expose that knowledge to any compatible AI agent.

The long-term vision is:

> **Build it. Understand it. Remember it. Explain it. Defend it.**

---

# 4. What Project Memory Is

Project Memory is not simply a "chat with your PDF" RAG application.

It combines:

```text
Project Ingestion
        ↓
Code / Document Analysis
        ↓
Structured Project Memory
        +
Semantic Retrieval
        ↓
AI Reasoning
        ↓
Web / CLI / MCP
        ↓
Developers + AI Agents
```

The system should understand the difference between:

### What the developer says the project does

and

### What the project actually does.

For example:

```text
PROJECT REPORT

"Redis is used for caching."

          ↓

CODE ANALYSIS

Redis is actually used for:
- background jobs
- worker coordination
- retry state

          ↓

PROJECT MEMORY

⚠️ Documentation and implementation differ.
```

This makes the system useful not only for remembering a project, but also for **understanding and verifying it**.

---

# 5. Core Product Components

## 5.1 Project Ingestion

Users should be able to provide:

- README files
- PDF project reports
- Documentation
- GitHub repositories
- ZIP repositories
- Local projects

The ingestion system extracts:

- Project description
- Technology stack
- Architecture
- APIs
- Database structure
- Important files
- Dependencies
- Technical decisions
- Features
- Implementation details

---

# 6. Project Memory

The central component is a persistent project knowledge system.

Conceptually:

```text
Project Memory
│
├── Project Identity
├── Technology Stack
├── Architecture
├── Database
├── APIs
├── Important Modules
├── Technical Decisions
├── Coding Conventions
├── Dependencies
├── Known Problems
├── Project History
├── Recent Changes
└── Interview Knowledge
```

Project Memory should contain both:

### Structured memory

For facts and deterministic information.

Example:

```json
{
  "database": "PostgreSQL",
  "backend": "FastAPI",
  "frontend": "Next.js",
  "queue": "Redis"
}
```

### Semantic memory

For contextual knowledge and natural-language retrieval.

Example:

> "Redis is used as the job queue because workers need a lightweight mechanism for receiving background tasks."

---

# 7. Local-First Memory

One of the most important principles is **local ownership of project memory**.

The CLI should allow developers to maintain memory locally alongside their project.

For example:

```text
.my-project-memory/
├── manifest.json
├── architecture.json
├── decisions.json
├── conventions.json
├── dependencies.json
├── project-summary.md
├── knowledge/
│   ├── authentication.md
│   ├── database.md
│   ├── workers.md
│   └── api.md
├── index/
└── history/
```

The developer should not be locked into a particular AI provider.

The memory belongs to the project.

This enables:

```text
Claude Code
      ↓
Project Memory
      ↓
Codex
      ↓
Project Memory
      ↓
Cursor
      ↓
Project Memory
```

The developer can switch AI coding agents without losing the project's accumulated context.

---

# 8. Token Efficiency

Token efficiency is a core design goal.

The system should **never send the entire repository to an LLM when a small amount of context is sufficient**.

Instead:

```text
User Question
      ↓
Query Understanding
      ↓
Structured Memory
      ↓
Semantic Retrieval
      ↓
Relevant Files / Knowledge
      ↓
LLM
      ↓
Answer
```

For simple questions:

```text
"What database am I using?"

→ Structured memory
→ No expensive LLM reasoning required
```

For technical questions:

```text
"Why did I use Redis?"

→ Retrieve Redis-related knowledge
→ Retrieve relevant implementation
→ LLM reasoning
```

For complex questions:

```text
"What happens if a worker crashes during job execution?"

→ Retrieve worker
→ Retrieve queue
→ Retrieve retry logic
→ Retrieve database state
→ LLM reasoning
```

The principle is:

> **Give the AI the smallest amount of context required to answer correctly.**

---

# 9. Project Synchronization

Project Memory should evolve as the project evolves.

A project may change through:

- Git commits
- Coding agents
- Manual development
- Dependency changes
- Architecture changes

The memory should detect meaningful changes.

Conceptually:

```text
Git Diff
   ↓
Changed Files
   ↓
Impact Analysis
   ↓
Update Project Memory
   ↓
New Project State
```

For example:

```text
Architecture V1
      ↓
Redis introduced
      ↓
Worker system changed
      ↓
Architecture V2
```

The system should be able to answer:

> "Why was Redis introduced?"

using project history and technical decisions.

---

# 10. Web Application

The web application is the primary user-facing experience.

Users should be able to:

- Create projects
- Upload reports
- Connect repositories
- Explore project architecture
- Ask questions
- Search project knowledge
- View technical decisions
- Run interview simulations
- Generate coding-agent prompts
- Review project changes
- Inspect knowledge sources

Example:

```text
┌───────────────────────────────────────┐
│ Project Memory                        │
├───────────────────────────────────────┤
│                                       │
│  Atlas                                │
│                                       │
│  Next.js → API → Redis → PostgreSQL  │
│                                       │
│  Architecture                         │
│  Technical Decisions                  │
│  Important Files                      │
│  Interview Mode                       │
│                                       │
│  Ask about your project...            │
│                                       │
└───────────────────────────────────────┘
```

---

# 11. Interview Mode

One of the main user-facing features is a technical interview simulator.

Instead of asking generic questions, the AI should ask questions based on the user's actual project.

### Basic

> What does your project do?

### Technical

> Why did you choose PostgreSQL?

### Architecture

> How does a request move through your system?

### Failure scenario

> What happens if the Redis worker crashes?

### Scaling

> What would become the bottleneck at 100,000 concurrent users?

### Senior-level

> Your current architecture has a single point of failure. Where is it and how would you remove it?

The system evaluates:

- Technical accuracy
- Depth
- Architecture understanding
- Specificity
- Clarity
- Missing concepts

The goal is not to help users memorize answers.

The goal is to help them **actually understand and defend what they built**.

---

# 12. Coding Agent Prompt Generation

Project Memory should help developers modify their projects through AI coding agents.

A user might ask:

> "Add rate limiting to my API."

The system generates an architecture-aware task containing:

```text
PROJECT CONTEXT

CURRENT ARCHITECTURE

RELEVANT FILES

TASK

CONSTRAINTS

IMPLEMENTATION REQUIREMENTS

ACCEPTANCE CRITERIA

TEST REQUIREMENTS

DO NOT CHANGE
```

The developer can then use the generated context with:

- Claude Code
- Codex
- Cursor
- Antigravity
- Other compatible coding agents

The goal is to make the agent operate with **project-specific context instead of generic assumptions**.

---

# 13. MCP Integration

Project Memory should expose project knowledge through MCP.

A local MCP server could provide tools such as:

```text
get_project_context()
search_project_memory()
get_architecture()
get_technical_decision()
get_recent_changes()
explain_module()
find_implementation()
get_project_conventions()
generate_interview_question()
record_project_change()
```

The AI coding agent can retrieve information only when it needs it.

Conceptually:

```text
              AI Coding Agent
                     │
                    MCP
                     │
                     ▼
             Project Memory
               /          \
              /            \
     Structured Memory    Search
              \            /
               \          /
                Project
```

This makes Project Memory an **agent-accessible project knowledge layer**.

---

# 14. npm Package

The core system should be reusable outside the web application.

Potential packages:

```text
@project-memory/core
@project-memory/analyzer
@project-memory/mcp
@project-memory/cli
```

The core package should provide APIs for:

- Project ingestion
- Project analysis
- Memory management
- Retrieval
- Interview generation
- Prompt generation
- Project synchronization

This allows developers to build their own applications around Project Memory.

---

# 15. CLI

The CLI should provide a local developer experience.

Example:

```bash
npx project-memory init
```

Then:

```bash
project-memory analyze
project-memory sync
project-memory search "authentication"
project-memory explain src/auth.ts
project-memory interview
project-memory mcp
```

The CLI should make Project Memory useful even without the web application.

---

# 16. Open Source Strategy

The project should follow an **open-source-first / open-core direction**.

The open-source layer should contain the developer primitive:

```text
Core
Analyzer
CLI
MCP
Memory format
Local storage
Basic retrieval
```

A potential hosted product can provide:

```text
Cloud synchronization
Team memory
Collaboration
Backups
Advanced analytics
Hosted AI
Enterprise controls
Advanced interview analytics
```

The goal is not to lock developers into the hosted platform.

The goal is to establish **Project Memory as an open and portable project-context layer**.

---

# 17. Privacy & Security

Project Memory will potentially handle highly sensitive source code.

Security must therefore be considered from the beginning.

Important requirements include:

- Local-first operation
- Explicit repository permissions
- Secret detection
- `.env` protection
- API-key detection
- Secure storage
- Authentication
- Authorization
- Sandboxed code analysis
- Rate limiting
- Audit logs
- Minimal data collection

The system should never blindly ingest secrets into project memory.

The user should always understand:

> **What data is stored, where it is stored, and what AI systems can access it.**

---

# 18. High-Level Architecture

```text
                           PROJECT MEMORY
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
         Web Application       CLI             MCP Server
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
                                ▼
                     Project Intelligence Core
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
      Ingestion             Code Analysis        Memory Engine
          │                     │                     │
          │                     │              ┌──────┴──────┐
          │                     │              ▼             ▼
          │                     │        Structured       Vector
          │                     │          Memory         Search
          │                     │              │             │
          └─────────────────────┴──────────────┴─────────────┘
                                │
                                ▼
                           AI Engine
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             Interview Engine       Prompt Generator
```

---

# 19. Long-Term Vision

The long-term goal is not simply to build a better RAG chatbot.

The goal is to create a **portable project memory standard** that allows software projects to maintain their own context across AI tools.

Imagine a future where:

```text
Developer starts project
        ↓
Project Memory initialized
        ↓
Developer uses Claude
        ↓
Project evolves
        ↓
Memory updates
        ↓
Developer switches to Codex
        ↓
Codex reads Project Memory
        ↓
Developer switches to Cursor
        ↓
Cursor reads the same memory
        ↓
Developer interviews for a job
        ↓
Project Memory trains the developer
```

The project becomes the persistent source of truth.

---

# 20. Product Philosophy

### Principle 1 — The project owns the memory

Memory should not belong to an AI provider.

### Principle 2 — Local-first by default

Developers should be able to use the core system without uploading their source code.

### Principle 3 — Token efficiency matters

Retrieve only the context necessary for the task.

### Principle 4 — Code is the source of truth

Documentation and reports should be compared against implementation.

### Principle 5 — AI should explain, not fabricate

Answers should be grounded in project sources.

### Principle 6 — Agents should be interchangeable

Switching coding agents should not mean losing project context.

### Principle 7 — Open standards win

The memory layer should be usable by multiple AI tools and agents.

---

# 21. Development Roadmap

## Phase 1 — Core MVP

- [x] Project creation
- [x] Report/document ingestion
- [x] GitHub/local repository ingestion
- [x] Project metadata extraction
- [x] Basic structured memory
- [x] Vector retrieval
- [x] Project chat
- [x] Source-aware answers

## Phase 2 — Project Intelligence

- [x] Code analysis
- [x] Architecture extraction
- [x] Important file detection
- [ ] Technical decision extraction
- [ ] Code/document mismatch detection
- [ ] Git history analysis
- [ ] Incremental memory updates

## Phase 3 — Developer Tools

- [x] CLI
- [x] npm package
- [x] Local project memory
- [ ] Project synchronization
- [x] Token tracking
- [x] Context optimization

## Phase 4 — MCP

- [x] MCP server
- [x] Project context tools
- [x] Search tools
- [x] Architecture tools
- [x] Change/history tools
- [x] Coding-agent integration (automatic mcp:setup command)

## Phase 5 — Interview Intelligence

- [x] Project-specific questions
- [x] Technical interview mode (terminal CLI & interactive session)
- [x] Difficulty levels (Basic, Technical, Architecture, Failure scenario, Scaling)
- [x] Answer evaluation (accuracy, depth, architecture understanding rubric)
- [x] Weak-area detection (strengths, missing points, pro tips)
- [ ] Interview history persist to disk

## Phase 6 — Ecosystem

- [ ] Public npm packages
- [ ] Open-source repository
- [ ] Developer documentation
- [ ] Plugin ecosystem
- [ ] Multiple AI-agent integrations
- [ ] Hosted cloud platform

---

# 22. Final Vision

Project Memory should make the following possible:

> **Build a project once. Keep its knowledge forever.**

A developer should be able to move between:

```text
Claude Code
Cursor
Codex
Antigravity
Future AI Agents
```

without having to repeatedly explain their project.

The same memory should help them:

```text
Understand their project
        ↓
Modify their project
        ↓
Maintain their project
        ↓
Explain their project
        ↓
Defend their project
```

The ultimate goal is to make **project context portable, persistent, verifiable, token-efficient, and accessible to both humans and AI agents.**

> **Project Memory — Your project should remember what you built.**