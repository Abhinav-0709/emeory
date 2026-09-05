# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

### How to report

Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) if it is enabled on this repository.

If private reporting is not available, contact the maintainer directly through the contact method listed on their GitHub profile.

Please include:
- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix, if you have one

### What to expect

This project is maintained by a small team. There is no formal SLA for response times or patches. We will acknowledge your report as quickly as possible and aim to address confirmed vulnerabilities before public disclosure.

---

## Scope

This policy covers the source code in this repository.

It does not cover:
- Third-party services (Groq, Google Gemini) that Emeory can optionally connect to
- Your own `.emeory/` data directory or any `.env` files you create

---

## Security notes for users

- **API keys**: Store API keys in `.env` at the project root. This file is excluded from git by `.gitignore`. Do not commit it.
- **Local data**: All project memory is stored in `.emeory/` on your local filesystem. Add `.emeory/` to your project's `.gitignore` to prevent accidentally committing it.
- **External requests**: Emeory only makes outbound requests when `GEMINI_API_KEY` or `GROQ_API_KEY` is set. The request payload contains the assembled project context summary — not raw source files.
