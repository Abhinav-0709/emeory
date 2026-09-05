# Contributing to Emeory

Thank you for your interest. This document describes how to set up the repository and contribute.

---

## Prerequisites

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

---

## Repository setup

```bash
git clone <repository-url>
cd memory-project
pnpm install
```

---

## Repository structure

```
memory-project/
├── packages/
│   ├── core/        # Types, storage, keyword retrieval
│   ├── analyzer/    # File scanner, tech-stack detector
│   ├── cli/         # emeory CLI binary
│   ├── mcp/         # MCP stdio server
│   └── interview/   # Interview question generator and evaluator
└── apps/
    └── web/         # Next.js dashboard
```

---

## Development commands

**Build all packages:**
```bash
pnpm build
```

**Build only the CLI:**
```bash
pnpm --filter emeory build
```

**Typecheck all packages:**
```bash
pnpm typecheck
```

**Run the web app in dev mode:**
```bash
cd apps/web
pnpm dev
```

**Run the CLI locally (after building):**
```bash
node packages/cli/dist/index.js <command>
```

---

## Testing

There is currently no test suite configured. If you add tests, document the test runner and command in this file.

---

## Environment variables

Copy `.env.example` to `.env` at the project root and fill in your API keys if you want to test AI synthesis:

```bash
cp .env.example .env
```

| Variable | Purpose |
| :--- | :--- |
| `GEMINI_API_KEY` | Enables Google Gemini for `ask` and `interview` |
| `GROQ_API_KEY` | Enables Groq for `ask` and `interview` |
| `GROQ_MODEL` | Override the default Groq model name |

Both are optional. The CLI works offline without them.

---

## Submitting changes

1. Fork the repository and create a branch from `main`.
2. Make your changes.
3. Run `pnpm build` and `pnpm typecheck` and verify they pass with no errors.
4. Open a pull request with a clear description of what changed and why.

There is currently no formal PR template or CI pipeline. Both are planned.

---

## Notes

- `.emeory/` is excluded from git. Do not commit generated memory files.
- `.env` is excluded from git. Do not commit API keys.
- The `dist/` directories are excluded from git. Always build from source.
