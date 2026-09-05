```text
                                                      Remember more.
                                                      Build further.

                       ███████╗███╗   ███╗███████╗ ██████╗ ██████╗ ██╗   ██╗
                       ██╔════╝████╗ ████║██╔════╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
                       █████╗  ██╔████╔██║█████╗  ██║   ██║██████╔╝ ╚████╔╝ 
                       ██╔══╝  ██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██╗  ╚██╔╝  
                       ███████╗██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║   ██║   
                       ╚══════╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   

Persistent memory for your code.
Built for developers. Designed for AI.
```

<div align="center">

[![npm version](https://img.shields.io/npm/v/emeory?style=flat-square&color=CB3837&logo=npm)](https://www.npmjs.com/package/emeory)
[![CI](https://img.shields.io/github/actions/workflow/status/Abhinav-0709/emeory/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/Abhinav-0709/emeory/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520.0-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10+-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![MCP](https://img.shields.io/badge/MCP-Protocol%20Ready-6A1B9A?style=flat-square)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-MIT%20%7C%20Apache%202.0%20%7C%20AGPLv3-blue?style=flat-square)](#-licensing)

<p align="center">
  <a href="#-the-problem">The Problem</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-cli-commands">CLI Reference</a> •
  <a href="#-mcp-integration">MCP Protocol</a> •
  <a href="#-data-storage">Storage</a> •
  <a href="#-licensing">Licensing</a>
</p>

</div>

---

## 💡 The Problem

Every time you open an AI coding agent (**Cursor**, **Antigravity**, **Claude Code**, or **Copilot**), it starts with **zero working knowledge** of your project:

- ❌ It consumes thousands of tokens re-reading files trying to infer your stack.
- ❌ It invents architectural patterns that conflict with existing conventions.
- ❌ It forgets why architectural decisions (ADRs) were made last week.
- ❌ Switching between agents or restarting sessions resets the mental context.

**Emeory fixes this.** It scans your repository once, extracts your tech stack, architecture layout, and technical decisions, and keeps them structured in a compact local `.emeory/` directory.

Any AI agent connecting through the **Model Context Protocol (MCP)** can query this persistent memory in milliseconds — without burning context windows re-reading the entire repo.

---

## ⚡ Quick Start in 60 Seconds

### 1. Installation & Usage

#### Option A: Run directly via package manager (No cloning required once published)

```bash
# Using npx (npm)
npx emeory init

# Using pnpm dlx
pnpm dlx emeory init

# Using bunx
bunx emeory init

# Or install globally:
npm install -g emeory
# or
pnpm add -g emeory
```

#### Option B: Build from source (Contributors / Local Development)

```bash
# Clone the monorepo
git clone https://github.com/your-username/memory-project.git
cd memory-project

# Install dependencies and build all packages
pnpm install
pnpm build

# Link CLI globally for local testing
cd packages/cli
npm link
```

### 2. Initialize your project memory

Navigate to any software project and run:

```bash
emeory init
```

Emeory analyzes `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, and file structures to automatically detect frameworks, databases, and architectural layers.

### 3. Check memory status

```bash
emeory status
```

```text
╭─ ● Project Memory Status ────────────────────────────────────────────╮
│                                                                      │
│  Status         Ready                                                │
│  Project        my-project                                           │
│  Files Indexed  87                                                   │
│  Last Sync      Just now                                             │
│  Memory Items   15 (1 decisions, 0 notes, 6 architecture, 8 tech stack)│
│  Engine Mode    Local Offline (zero-daemon)                          │
│  MCP Server     active (Cursor & Antigravity)                        │
│                                                                      │
╰──────────────────────────────────────────────────────────────────────╯
```

### 4. Connect to your AI Editor (Cursor / Antigravity)

Configure MCP with a single command:

```bash
emeory mcp:setup
```

This auto-generates `.cursor/mcp.json` and `.agents/mcp_config.json`, instantly granting your AI agent access to 6 dedicated memory query tools.

---

## 🏗️ Architecture

Emeory is designed as an **offline-first, zero-daemon** architecture. Everything is stored as plain JSON and Markdown right inside your repository.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                             YOUR REPOSITORY                              │
│                                                                          │
│   Source Files & Configs                   Local Persistent Memory       │
│   ┌──────────────────────────┐             ┌─────────────────────────┐   │
│   │ package.json, go.mod,    │             │ .emeory/                │   │
│   │ Cargo.toml, src/**/*.ts  │             │  ├── manifest.json      │   │
│   └────────────┬─────────────┘             │  ├── architecture.json  │   │
│                │                           │  ├── decisions.json     │   │
│                │ emeory init / sync        │  ├── tech-stack.json    │   │
│                ▼                           │  └── knowledge/*.md     │   │
│   ┌──────────────────────────┐             └───────────▲─────────────┘   │
│   │ @project-memory/analyzer │                         │                 │
│   │ Scanner & Tech Detector  ├─────────────────────────┤ read / write    │
│   └──────────────────────────┘                         │                 │
└────────────────────────────────────────────────────────┼─────────────────┘
                                                         │
                         ┌───────────────────────────────┴──────────────┐
                         │              EMEORY CORE ENGINE              │
                         │                                              │
                         │   @project-memory/core                       │
                         │   Dual Memory Store & Offline Retriever      │
                         └───────▲──────────────────────────────▲───────┘
                                 │                              │
                ┌────────────────┴──────────────┐    ┌──────────┴─────────────┐
                │          emeory CLI           │    │   @project-memory/mcp  │
                │ Interactive REPL & Commands   │    │  Stdio Protocol Server │
                └───────────────▲───────────────┘    └──────────▲─────────────┘
                                │                               │
                     ┌──────────┴──────────┐       ┌────────────┴────────────┐
                     │ Developer Terminal  │       │  AI Coding Assistants   │
                     │  • emeory status    │       │  • Cursor (.cursor)     │
                     │  • emeory ask       │       │  • Antigravity (.agents)│
                     │  • emeory add       │       │  • Claude Code / Desktop│
                     └─────────────────────┘       └─────────────────────────┘
```

---

## 💻 CLI Command Reference

You can run commands individually or type `emeory` with no arguments to launch an **interactive terminal session**.

| Command | Usage | Description |
| :--- | :--- | :--- |
| `init` | `emeory init [name]` | Scans current repo, detects tech stack & structure, creates `.emeory/` |
| `status` | `emeory status` | Displays indexed files, items count, and sync state |
| `ask` | `emeory ask "<question>"` | Query your project memory with offline deterministic answers or LLM |
| `search` | `emeory search "<query>"` | Fast offline search across all stored facts & chunks |
| `add` | `emeory add "<title>" "<details>"` | Record notes, ADR decisions, or conventions (`--type decision`) |
| `sync` | `emeory sync` | Re-scans repository to update tech stack without losing notes |
| `config` | `emeory config [set\|remove]` | View config or manage API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`) |
| `mcp` | `emeory mcp` | Starts the Model Context Protocol stdio server |
| `mcp:setup` | `emeory mcp:setup [target]` | Auto-configures Cursor (`cursor`) or Antigravity (`antigravity`) |
| `interview` | `emeory interview` | Interactive CLI drill evaluating your codebase knowledge |

### 🔑 Managing API Keys
Emeory works 100% offline out-of-the-box. If you wish to enable LLM reasoning synthesis, you can set or remove API keys directly through the CLI:

```bash
# Add or update an API key (saves to .env automatically)
emeory config set GROQ_API_KEY gsk_your_key_here
emeory config set GEMINI_API_KEY your_key_here

# Remove an API key (falls back to local offline engine)
emeory config remove GROQ_API_KEY
```

### 🧠 Intelligent Offline Queries (No LLM Required)
Emeory features a deterministic intent engine that answers questions about your project instantly with zero hallucinations and zero API tokens:

```bash
# Architecture & Components
emeory ask "what is the architecture?"

# Decisions & ADRs
emeory ask "what decisions did we take?"

# Database & Technology Verification
emeory ask "what db used?"
emeory ask "is supabase used?"
emeory ask "what is the tech stack?"

# Code Locations
emeory ask "where is the auth logic?"
emeory ask "where is the cli entrypoint?"
```

### 📝 Recording Technical Decisions (ADR)
Capture critical architectural decisions directly from your terminal:
```bash
emeory add "Use Redis for caching" "TTL set to 3600s to ease DB load" --type decision --tags cache,perf
```

### Asking Questions
```bash
emeory ask "What is our database strategy?"
```
> **Privacy Note:** If `GEMINI_API_KEY` or `GROQ_API_KEY` is provided, the answer is synthesized by the LLM using retrieved memory chunks. If **no API key** is configured, Emeory returns the retrieved local facts directly with **zero outbound network traffic**.

---

## 🤖 MCP Integration (Model Context Protocol)

When running `emeory mcp`, your AI coding agent connects over `stdio` and gains access to 6 specialized context tools:

```
┌──────────────────────────────┬────────────────────────────────────────────────────────┐
│ MCP Tool                     │ Purpose                                                │
├──────────────────────────────┼────────────────────────────────────────────────────────┤
│ get_project_context          │ Returns high-level stack, project identity, & files    │
│ search_project_memory        │ Keyword search across all indexed architectural chunks │
│ get_architecture             │ Returns component hierarchy, responsibilities, & deps  │
│ get_technical_decisions      │ Fetches all recorded ADRs and rationale                │
│ get_project_conventions      │ Returns team coding rules and patterns                 │
│ record_technical_decision    │ Allows the AI agent to save newly agreed decisions     │
└──────────────────────────────┴────────────────────────────────────────────────────────┘
```

### Auto-Configuration
Configure your environment with one command:
```bash
emeory mcp:setup
```
This writes:
- `.cursor/mcp.json` for **Cursor**
- `.agents/mcp_config.json` for **Antigravity**

For **Claude Desktop**, add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "emeory": {
      "command": "node",
      "args": ["<absolute-path-to-memory-project>/packages/cli/dist/index.js", "mcp"]
    }
  }
}
```

---

## 📁 Data Storage (`.emeory/`)

All project memory lives inside `.emeory/` at the root of your project. It requires no background database daemon:

```
.emeory/
├── manifest.json         # Project metadata & scan timestamps
├── tech-stack.json       # Detected frameworks, runtimes, and libraries
├── architecture.json     # Components, modules, and folder roles
├── decisions.json        # Recorded ADRs (Architectural Decision Records)
├── notes.json            # Freeform developer notes & context snippets
├── conventions.json      # Code style, architectural conventions
├── discrepancies.json    # Doc-vs-code drift items
├── index/
│   └── chunks.json       # Indexed retrieval units
└── knowledge/
    └── *.md              # Human-readable markdown chunks
```

> 🛡️ **Recommended:** Add `.emeory/` to your `.gitignore` to keep local scratch data private, or commit it if you want your whole team to share the exact same project memory!

---

## ⚙️ Environment Variables

Emeory works 100% offline out-of-the-box. Optional AI synthesis can be enabled by setting:

| Variable | Optional | Default | Description |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key (takes top priority for synthesis) |
| `GROQ_API_KEY` | Yes | — | Groq Cloud API key for ultra-fast Llama-powered synthesis |
| `GROQ_MODEL` | Yes | `openai/gpt-oss-120b` | Override default Groq model |

Copy the template to create your `.env`:
```bash
cp .env.example .env
```

---

## 📦 Monorepo Structure

Emeory is engineered as a clean TypeScript monorepo powered by `pnpm`:

```
memory-project/
├── packages/
│   ├── core/          # Domain types, Local JSON storage, keyword retriever
│   ├── analyzer/      # Repo scanner, regex secret filters, stack detector
│   ├── cli/           # Main "emeory" CLI binary (bundled with tsup)
│   ├── mcp/           # Official MCP SDK stdio server implementation
│   └── interview/     # Codebase interview engine & question evaluator
└── apps/
    └── web/           # Next.js companion web dashboard (experimental / in development)
```

---

## 🚦 Project Status & Roadmap

Emeory is in active early development. Here is our honest implementation status:

- [x] **Repository Analysis**: Config scanner (Node, Go, Rust, Python, etc.)
- [x] **Dual Memory Engine**: Structured JSON + human-readable Markdown chunks
- [x] **Complete CLI**: Interactive REPL + 11 standalone subcommands
- [x] **MCP Server**: 6 working tools compatible with Cursor, Antigravity, & Claude
- [x] **Autonomous Bundling**: Self-contained CLI bundle via `tsup`
- [ ] **Vector Embeddings**: Dense vector search (currently lexical keyword search)
- [ ] **Git History Ingestion**: Extracting historical context from git commits
- [x] **npm Registry Publication**: Published and live on [npmjs.com/package/emeory](https://www.npmjs.com/package/emeory)
- [ ] **Automated CI/CD**: GitHub Actions workflow and test suite

---

## 🤝 Contributing

Contributions are warmly welcome! Check out [CONTRIBUTING.md](./CONTRIBUTING.md) for local development workflows and code conventions, and please read our [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

For vulnerability reporting, see [SECURITY.md](./SECURITY.md).

---

## 📄 Licensing

Emeory provides three standard open-source license options to support different distribution and deployment needs:

- **[MIT License](./LICENSE-MIT)** — Permissive, concise, and widely used across the JavaScript ecosystem.
- **[Apache License 2.0](./LICENSE-APACHE)** — Permissive with explicit contributor patent grants and retaliation clauses.
- **[GNU AGPLv3](./LICENSE-AGPL)** — Strong copyleft protection designed for cloud/networked software services.

You are free to adopt, modify, and distribute this software under the terms of any of the above licenses.
