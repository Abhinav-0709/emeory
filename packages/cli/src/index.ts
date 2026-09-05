#!/usr/bin/env node
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as process from 'node:process';
import * as readline from 'node:readline';
import dotenv from 'dotenv';
import pc from 'picocolors';
import {
  LocalStructuredMemoryStore,
  LocalSemanticMemoryStore,
  MemoryRetriever,
  type ProjectIdentity,
  type ProjectNote,
  type TechnicalDecision,
} from '@project-memory/core';
import { ProjectAnalyzer, scanRepository } from '@project-memory/analyzer';
import { TerminalUi } from './terminal-ui.js';
import { AiEngine } from './ai-engine.js';
import {
  renderHeader,
  getQuickCommandsBoxLines,
  getStatusBoxLines,
  getTipsBoxLines,
  renderSideBySide,
  renderAnswerCard,
  renderConfigBox,
} from './theme.js';
import {
  openBrowser,
  getWebInterfaceUrl,
  isMcpRunning,
  recordMcpPid,
  getMcpDisplayInfo,
} from './helpers.js';

// Automatically load .env from project root if present
dotenv.config({ quiet: true });

export function printHelp(): void {
  const cwd = process.cwd();
  const projectName = path.basename(cwd);
  console.log(`
${pc.cyan('➜ ' + projectName)} ${pc.white('emeory help')}

${pc.bold('Persistent memory for your code. Built for developers. Designed for AI.')}

${pc.bold('Usage:')}
  emeory                  Start full interactive terminal session
  emeory <command> [args] Direct CLI commands

${pc.bold('Commands:')}
  init [name]             Initialize Emeory in this project
  status                  Show project memory status
  add [title] [details]   Add a note / decision / context
  search <query>          Search project memory with intent classification
  ask <query>             Ask questions with source-grounded AI synthesis
  mcp                     Start the MCP server over stdio
  mcp:setup [target]      Configure MCP for Cursor, Antigravity, or Claude
  sync                    Re-index and update memory from current code
  config [set|remove]     View or configure API keys (GROQ_API_KEY, GEMINI_API_KEY)
  interview               Start technical interview drill simulator
  help                    Show this help message
`);
}

export function handleInit(args: string[]): void {
  const cwd = process.cwd();
  const projectName = args[0] || path.basename(cwd);

  renderHeader('v0.1.0');

  const store = new LocalStructuredMemoryStore({ projectRoot: cwd });
  const now = new Date().toISOString();

  const identity: ProjectIdentity = {
    name: projectName,
    version: '0.1.0',
    description: 'Software project managed with Emeory',
    rootPath: cwd,
    createdAt: now,
    updatedAt: now,
  };

  store.initialize(identity);

  // Ensure .emeory/ is in .gitignore to prevent accidental secret leakage (Risk #3)
  const gitignorePath = path.join(cwd, '.gitignore');
  try {
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      if (!gitignoreContent.includes('.emeory')) {
        fs.appendFileSync(gitignorePath, '\n# Emeory local memory\n.emeory/\n');
      }
    } else {
      fs.writeFileSync(gitignorePath, '# Emeory local memory\n.emeory/\n', 'utf-8');
    }
  } catch {
    // ignore filesystem errors
  }

  const analyzer = new ProjectAnalyzer(cwd);
  const summary = analyzer.analyze();

  const leftLines = [
    pc.green('✔') + ' Creating .emeory/ directory',
    pc.green('✔') + ' Protected .emeory/ in .gitignore',
    pc.green('✔') + ' Analyzing project structure',
    pc.green('✔') + ` Indexing source files (${summary.filesScanned} files)`,
    pc.green('✔') + ' Extracting key context (architecture, decisions, etc.)',
    pc.green('✔') + ' Setting up local database',
    pc.green('✔') + ' Generating initial memory',
    '',
    pc.bold(pc.green('Emeory is ready!')),
    pc.dim('Your project memory has been initialized.'),
    '',
    pc.bold('Next steps:'),
    pc.cyan('› emeory status') + '   ' + pc.dim('Check your memory status'),
    pc.cyan('› emeory add') + '      ' + pc.dim('Add notes, decisions, or context'),
    pc.cyan('› emeory ask') + '      ' + pc.dim('Ask questions about codebase'),
    pc.cyan('› emeory mcp') + '      ' + pc.dim('Start the MCP server'),
  ];

  const rightLines = getQuickCommandsBoxLines();
  renderSideBySide(leftLines, rightLines, 4);
  console.log('');
}

export async function handleStatus(): Promise<void> {
  const cwd = process.cwd();
  const store = new LocalStructuredMemoryStore({ projectRoot: cwd });

  if (!store.exists()) {
    console.log(pc.yellow('\n[Emeory] Not initialized. Run "emeory init" to start.\n'));
    return;
  }

  const state = store.readState();
  if (!state) {
    console.log(pc.red('\n[Emeory] Memory directory exists but state could not be loaded.\n'));
    return;
  }

  const files = scanRepository(cwd);
  const mcpInfo = getMcpDisplayInfo(cwd);

  const statusLines = getStatusBoxLines(state, files.length, mcpInfo.displayValue);
  const tipsLines = getTipsBoxLines();

  console.log('');
  renderSideBySide(statusLines, tipsLines, 4);
  console.log('');
}

export async function handleAdd(args: string[]): Promise<void> {
  const cwd = process.cwd();
  const store = new LocalStructuredMemoryStore({ projectRoot: cwd });

  if (!store.exists()) {
    console.log(pc.yellow('\n[Emeory] Project memory is not initialized. Run "emeory init" first.\n'));
    return;
  }

  const state = store.readState();
  if (!state) {
    console.log(pc.red('\n[Emeory] Could not load project memory state.\n'));
    return;
  }

  let type: 'note' | 'decision' | 'context' = 'note';
  let title = '';
  let details = '';
  let tags: string[] = [];

  // Parse arguments if provided
  const nonFlags: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    if (arg === '--type' && nextArg) {
      const parsedType = nextArg.toLowerCase();
      if (parsedType === 'decision' || parsedType === 'context' || parsedType === 'note') {
        type = parsedType;
      }
      i++;
    } else if (arg === '--tags' && nextArg) {
      tags = nextArg.split(',').map((t) => t.trim()).filter(Boolean);
      i++;
    } else if (arg && !arg.startsWith('--')) {
      nonFlags.push(arg);
    }
  }

  if (nonFlags.length > 0 && nonFlags[0]) {
    title = nonFlags[0].replace(/^["']|["']$/g, '').trim();
    details = nonFlags.slice(1).join(' ').replace(/^["']|["']$/g, '').trim();
  }

  // If title was not given as CLI args, prompt interactively
  if (!title) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = (query: string): Promise<string> =>
      new Promise((resolve) => rl.question(query, resolve));

    try {
      console.log(pc.cyan('\n┌─ Add Project Memory Item ────────────────────────────────────┐'));
      const rawType = (
        await ask(pc.white('  Item Type (note / decision / context) [note]: '))
      ).trim().toLowerCase();
      if (rawType === 'decision' || rawType === 'context' || rawType === 'note') {
        type = rawType;
      }

      title = (await ask(pc.white('  Title / Summary: '))).trim();
      if (!title) {
        console.log(pc.yellow('\nTitle is required. Aborting.\n'));
        rl.close();
        return;
      }

      details = (await ask(pc.white('  Details / Rationale (optional): '))).trim();
      const rawTags = (await ask(pc.white('  Tags (comma-separated, optional): '))).trim();
      if (rawTags) {
        tags = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
      }
      console.log(pc.cyan('└──────────────────────────────────────────────────────────────┘\n'));
    } finally {
      rl.close();
    }
  }

  const now = new Date().toISOString();
  const semanticStore = new LocalSemanticMemoryStore(cwd);

  if (type === 'decision') {
    const nextNum = state.decisions.length + 1;
    const decisionId = `ADR-${String(nextNum).padStart(3, '0')}`;
    const newDecision: TechnicalDecision = {
      id: decisionId,
      title,
      status: 'accepted',
      context: details || title,
      decision: title,
      rationale: details || 'Recorded via emeory add',
      date: now.split('T')[0],
      source: {
        type: 'user-report',
        reference: 'cli:emeory add',
        timestamp: now,
      },
    };
    state.decisions.push(newDecision);

    semanticStore.saveChunk({
      id: decisionId,
      title,
      content: `# Decision: ${title}\n\n**Status**: Accepted\n**Context**: ${details || title}\n**Decision**: ${title}\n**Rationale**: ${details || 'N/A'}\n`,
      category: 'decision',
      tags: tags.length > 0 ? tags : ['decision', 'architecture'],
      sources: [newDecision.source],
      updatedAt: now,
    });
  } else {
    const noteId = `note-${Date.now()}`;
    const newNote: ProjectNote = {
      id: noteId,
      title,
      content: details || title,
      tags: tags.length > 0 ? tags : [type],
      createdAt: now,
      source: {
        type: 'user-report',
        reference: 'cli:emeory add',
        timestamp: now,
      },
    };
    state.notes = state.notes || [];
    state.notes.push(newNote);

    semanticStore.saveChunk({
      id: noteId,
      title,
      content: `# ${title}\n\n${details || ''}\n\nTags: ${(tags.length > 0 ? tags : [type]).join(', ')}`,
      category: 'workflow',
      tags: tags.length > 0 ? tags : [type],
      sources: [newNote.source],
      updatedAt: now,
    });
  }

  state.identity.updatedAt = now;
  store.saveState(state);

  console.log(pc.green('✔') + ` Successfully recorded ${type}: "${pc.bold(title)}"`);
  console.log(pc.dim(`  Saved to .emeory/ and indexed for AI retrieval.\n`));
}

export function handleSync(): void {
  const cwd = process.cwd();
  console.log(pc.cyan('⠋ Rescanning repository and updating project memory...'));

  const analyzer = new ProjectAnalyzer(cwd);
  const summary = analyzer.analyze();

  console.log(pc.green('✔') + ` Scanned repository (${summary.filesScanned} files)`);
  console.log(pc.green('✔') + ` Updated tech stack (${summary.techStackCount} facts)`);
  console.log(pc.green('✔') + ` Updated architecture modules (${summary.componentsFound} components)`);
  console.log(pc.green('✔') + ` Synced semantic knowledge (${summary.semanticChunksCreated} entries)`);

  const store = new LocalStructuredMemoryStore({ projectRoot: cwd });
  const state = store.readState();
  if (state?.discrepancies && state.discrepancies.length > 0) {
    console.log(pc.yellow(`\n⚠️  ${state.discrepancies.length} discrepancy(ies) detected:`));
    for (const disc of state.discrepancies) {
      console.log(pc.yellow(`  • [${disc.topic}] `) + disc.claimedByDoc.statement);
      console.log(pc.dim(`    → ${disc.actualInCode.statement}`));
    }
  }

  console.log(pc.yellow('\n✨') + ' ' + pc.bold(pc.green('Project memory is synchronized!\n')));
}

export async function handleWeb(): Promise<void> {
  console.log('\n' + pc.cyan('ⓘ ') + pc.bold('Emeory Web Dashboard is arriving in v2.0.'));
  console.log(pc.dim('  For v1.x, use the interactive CLI (') + pc.cyan('emeory') + pc.dim(') or AI agent integration via MCP.\n'));
}

export async function handleConfig(args: string[] = []): Promise<void> {
  const cwd = process.cwd();
  const envPath = path.join(cwd, '.env');
  const sub = args[0]?.toLowerCase();

  if (sub === 'set') {
    let keyName = args[1]?.toUpperCase();
    let val = args[2];

    if (!keyName || !val) {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

      if (!keyName) {
        console.log('\nSelect API Key to set:');
        console.log('1. GROQ_API_KEY (Recommended for fast reasoning)');
        console.log('2. GEMINI_API_KEY');
        const choice = (await ask('Enter choice [1-2] (default 1): ')).trim();
        keyName = choice === '2' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
      }

      if (!val) {
        val = (await ask(`Enter value for ${keyName}: `)).trim();
      }
      rl.close();
    }

    if (!val) {
      console.log(pc.yellow('Error: No key value provided.'));
      return;
    }

    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
    const regex = new RegExp(`^${keyName}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${keyName}=${val}`);
    } else {
      envContent = envContent.trim();
      envContent = envContent ? `${envContent}\n${keyName}=${val}\n` : `${keyName}=${val}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');
    process.env[keyName] = val;

    console.log(pc.green('\n✔') + ` Successfully saved ${pc.bold(keyName)} to ${pc.cyan('.env')}`);
    console.log(pc.dim('  API key is now active for Emeory CLI & interactive sessions.\n'));
    return;
  }

  if (sub === 'remove' || sub === 'delete' || sub === 'unset') {
    const keyName = args[1]?.toUpperCase();
    if (!keyName) {
      console.log(pc.yellow('\nError: Please specify key to remove (e.g. "emeory config remove GROQ_API_KEY")\n'));
      return;
    }

    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      const regex = new RegExp(`^${keyName}=.*$\n?`, 'm');
      envContent = envContent.replace(regex, '');
      fs.writeFileSync(envPath, envContent, 'utf-8');
    }
    delete process.env[keyName];

    console.log(pc.green('\n✔') + ` Removed ${pc.bold(keyName)} from ${pc.cyan('.env')}`);
    console.log(pc.dim('  Emeory will now use local offline deterministic engine for queries.\n'));
    return;
  }

  // Default: display config box
  const store = new LocalStructuredMemoryStore({ projectRoot: cwd });
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const mcpInfo = getMcpDisplayInfo(cwd);

  renderConfigBox(
    cwd,
    store.exists(),
    hasGemini,
    hasGroq,
    '',
    mcpInfo.displayValue
  );

  console.log(pc.dim('  To set an API key:   ') + pc.cyan('emeory config set GROQ_API_KEY <your-key>'));
  console.log(pc.dim('  To remove an API key:') + pc.cyan('emeory config remove GROQ_API_KEY\n'));
}

export function handleSearch(args: string[]): void {
  if (args.length === 0) {
    console.error(pc.yellow('Error: Please provide a search query.'));
    console.log('Example: emeory search "what database is used?"');
    process.exit(1);
  }

  const rawQuery = args.join(' ').trim();
  const query = rawQuery.replace(/^["']|["']$/g, '').trim();
  const cwd = process.cwd();
  const retriever = new MemoryRetriever(cwd);

  console.log(`\n${pc.dim('Query:')} "${pc.bold(query)}"`);
  const result = retriever.retrieve(query);
  console.log(`${pc.dim('Intent:')} ${pc.magenta(result.intent)}`);
  console.log(pc.blue('─'.repeat(60)));

  if (result.directAnswer) {
    console.log(pc.bold('Direct Answer:\n') + result.directAnswer + '\n');
  }

  if (result.assembledSummary) {
    console.log(pc.bold('Retrieved Context:'));
    console.log(result.assembledSummary);
  } else {
    console.log(pc.dim('No specific context found matching this query in project memory.'));
  }
  console.log('');
}

export async function handleAsk(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error(pc.yellow('Error: Please provide a question.'));
    console.log('Example: emeory ask "what database do we use and why?"');
    process.exit(1);
  }

  const rawQuery = args.join(' ').trim();
  const query = rawQuery.replace(/^["']|["']$/g, '').trim();
  const cwd = process.cwd();
  const retriever = new MemoryRetriever(cwd);
  const aiEngine = new AiEngine();

  console.log(`\n${pc.dim('Question:')} "${pc.bold(query)}"`);
  const context = retriever.retrieve(query);
  console.log(`${pc.dim('Intent:')} ${pc.magenta(context.intent)}`);

  console.log(pc.dim('⠋ Synthesizing source-grounded answer...'));
  const result = await aiEngine.answerQuestion(query, context);
  renderAnswerCard(result.answer, result.provider, result.model);
}

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case undefined: {
      const cwd = process.cwd();
      const ui = new TerminalUi(cwd);
      await ui.startInteractiveSession();
      break;
    }
    case 'init':
      handleInit(args);
      break;
    case 'status':
      await handleStatus();
      break;
    case 'add':
      await handleAdd(args);
      break;
    case 'sync':
      handleSync();
      break;
    case 'analyze':
      handleSync();
      break;
    case 'search':
      handleSearch(args);
      break;
    case 'ask':
      await handleAsk(args);
      break;
    case 'web':
      await handleWeb();
      break;
    case 'config':
      await handleConfig(args);
      break;
    case 'interview': {
      const { TerminalInterviewRunner } = await import('./interview-runner.js');
      const runner = new TerminalInterviewRunner(process.cwd());
      await runner.runSession();
      break;
    }
    case 'mcp': {
      recordMcpPid(process.cwd());
      const { runServer } = await import('@project-memory/mcp');
      await runServer();
      break;
    }
    case 'mcp:setup': {
      const { autoConfigureMcp } = await import('@project-memory/mcp');
      const target = (args[0]?.toLowerCase() as any) || 'all';
      const res = autoConfigureMcp({ projectRoot: process.cwd(), target });

      console.log('\n[Emeory MCP Setup]');
      if (res.configuredFiles.length > 0) {
        console.log(pc.green('✔') + ' Automatically generated / updated MCP configuration:');
        for (const file of res.configuredFiles) {
          console.log(`  -> ${file}`);
        }
      }
      for (const instr of res.instructions) {
        console.log(`\n${instr}`);
      }
      console.log('\nYour AI coding agent can now discover and call Emeory tools automatically!\n');
      break;
    }
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.error(pc.red(`Unknown command: ${command}`));
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Emeory] Fatal error:', err);
  process.exit(1);
});
