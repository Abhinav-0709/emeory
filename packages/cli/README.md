# Emeory CLI 🧠

> **Persistent memory for your code. Built for developers. Designed for AI.**

`emeory` gives your software projects persistent, portable memory. It analyzes your codebase, stores architectural decisions and context locally in `.emeory/`, and connects directly to AI coding agents (Cursor, Antigravity, Claude Code) via the Model Context Protocol (MCP).

---

## ⚡️ Quickstart

You can run Emeory instantly without installation:

```bash
npx emeory
```

Or install it globally:

```bash
npm install -g emeory
```

---

## 🚀 Usage

### Interactive Terminal Session
Run `emeory` inside any project to launch the interactive developer interface:

```bash
emeory
```

### CLI Commands

| Command | Description |
| :--- | :--- |
| `emeory init [name]` | Initialize `.emeory/` and index the current project |
| `emeory status` | View project memory health, indexed files, and MCP status |
| `emeory add [title] [details]` | Add a technical decision, note, or context item (`--type decision`) |
| `emeory ask "<question>"` | Ask questions with deterministic offline answers or LLM reasoning |
| `emeory search "<query>"` | Semantic and structured memory search |
| `emeory sync` | Re-index repository AST and sync updated memory |
| `emeory config [set\|remove]` | View config or configure API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`) |
| `emeory interview` | Interactive technical interview drill simulator |
| `emeory mcp` | Run the standard I/O MCP server for AI agents |
| `emeory mcp:setup [target]` | Auto-configure MCP for Cursor, Antigravity, or Claude Code |

### 🔑 Managing API Keys
Emeory is fully functional offline. To enable optional cloud LLM reasoning:
```bash
emeory config set GROQ_API_KEY gsk_...
emeory config set GEMINI_API_KEY ...
emeory config remove GROQ_API_KEY
```

### 🧠 Deterministic Offline Queries (Zero LLM Tokens)
```bash
emeory ask "what is the architecture?"
emeory ask "what db used?"
emeory ask "is supabase used?"
emeory ask "where is the auth logic?"
emeory ask "where is the cli entrypoint?"
emeory ask "what decisions did we take?"
```

---

## 🤖 Connecting to AI Agents (MCP)

To let Cursor, Antigravity, or Claude automatically read and record decisions in your project:

```bash
emeory mcp:setup
```

This auto-detects your editor and generates the required `.cursor/mcp.json`, `.agents/mcp_config.json`, or Claude configuration.

---

## 🔒 Privacy & Architecture

- **100% Local-First**: All data is stored in `.emeory/` in your repository.
- **Dual Memory Layer**: Deterministic JSON structured facts + semantic markdown knowledge chunks.
- **Zero Lock-in**: All stored files are human-readable JSON and Markdown.

---

## 📄 License

MIT © Emeory Contributors
