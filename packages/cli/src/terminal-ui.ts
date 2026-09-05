import * as path from 'node:path';
import * as fs from 'node:fs';
import * as readline from 'node:readline';
import * as process from 'node:process';
import pc from 'picocolors';
import {
  LocalStructuredMemoryStore,
  MemoryRetriever,
  type StructuredMemoryState,
} from '@project-memory/core';
import { scanRepository } from '@project-memory/analyzer';
import { AiEngine } from './ai-engine.js';
import {
  renderHeader,
  getQuickCommandsBoxLines,
  getStatusBoxLines,
  getTipsBoxLines,
  renderSideBySide,
} from './theme.js';
import {
  handleInit,
  handleStatus,
  handleAdd,
  handleSync,
  handleWeb,
  handleConfig,
  handleSearch,
  handleAsk,
  printHelp,
} from './index.js';

export class TerminalUi {
  private projectRoot: string;
  private store: LocalStructuredMemoryStore;
  private retriever: MemoryRetriever;
  private aiEngine: AiEngine;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.store = new LocalStructuredMemoryStore({ projectRoot });
    this.retriever = new MemoryRetriever(projectRoot);
    this.aiEngine = new AiEngine();
  }

  public renderBanner(state: StructuredMemoryState | null): void {
    console.clear();
    renderHeader('v0.1.0');

    const files = scanRepository(this.projectRoot);

    const leftLines = state
      ? [
        pc.green('✔') + ' Creating .emeory/ directory',
        pc.green('✔') + ' Analyzing project structure',
        pc.green('✔') + ` Indexing source files (${files.length} files)`,
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
      ]
      : [
        pc.yellow('⚠') + ' Project memory not initialized in this directory.',
        '',
        pc.dim('Type ') + pc.cyan('init') + pc.dim(' to create .emeory/ and index this project.'),
        '',
        pc.bold('Next steps:'),
        pc.cyan('› init') + '             ' + pc.dim('Scan files and initialize memory'),
        pc.cyan('› help') + '             ' + pc.dim('Show available commands'),
      ];

    const rightLines = getQuickCommandsBoxLines();
    renderSideBySide(leftLines, rightLines, 4);
    console.log('');
  }

  public async startInteractiveSession(): Promise<void> {
    let state = this.store.readState();
    this.renderBanner(state);

    const projectName = path.basename(this.projectRoot);
    const promptString = `${pc.cyan('➜')} ${pc.cyan(projectName)} ${pc.white('emeory')} `;

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: promptString,
    });

    rl.prompt();

    rl.on('line', async (line) => {
      let input = line.trim();
      if (!input) {
        rl.prompt();
        return;
      }

      // If user typed "emeory <cmd>" inside the interactive session
      if (input.toLowerCase().startsWith('emeory ')) {
        input = input.slice(7).trim();
      }

      const parsedTokens = parseCommandLine(input);
      const cmd = parsedTokens[0];
      const args = parsedTokens.slice(1);

      switch (cmd?.toLowerCase()) {
        case 'exit':
        case 'quit':
        case 'q':
          console.log(pc.dim('\nGoodbye!\n'));
          rl.close();
          process.exit(0);

        case 'clear':
        case 'cls':
          state = this.store.readState();
          this.renderBanner(state);
          break;

        case 'init':
          handleInit(args);
          state = this.store.readState();
          break;

        case 'status':
          await handleStatus();
          break;

        case 'add':
          rl.pause();
          await handleAdd(args);
          rl.resume();
          state = this.store.readState();
          break;

        case 'sync':
        case 'analyze':
          handleSync();
          state = this.store.readState();
          break;

        case 'web':
          await handleWeb();
          break;

        case 'config':
          await handleConfig(args);
          break;

        case 'mcp': {
          const cursorMcp = path.join(this.projectRoot, '.cursor', 'mcp.json');
          const agentsMcp = path.join(this.projectRoot, '.agents', 'mcp_config.json');
          const userHome = process.env.USERPROFILE || process.env.HOME || '';
          const globalMcp = path.join(userHome, '.gemini', 'config', 'mcp_config.json');

          const hasCursor = fs.existsSync(cursorMcp);
          const hasAgents = fs.existsSync(agentsMcp);
          const hasGlobal = fs.existsSync(globalMcp);

          console.log(pc.cyan('\n┌─ Emeory MCP Server ──────────────────────────────────────────┐'));
          console.log(pc.cyan('│') + '  ' + pc.green('●') + ' ' + pc.bold('Status:      ') + pc.green('Ready & Connected via stdio').padEnd(46) + pc.cyan('│'));
          console.log(pc.cyan('│') + '                                                                ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '  ' + pc.dim('Configured Clients:') + '                                           ' + pc.cyan('│'));

          if (hasAgents || hasGlobal) {
            const loc = hasAgents ? '.agents/mcp_config.json' : 'global Antigravity';
            console.log(pc.cyan('│') + '    ' + pc.green('✔') + ' ' + pc.white('Antigravity:') + ' ' + pc.dim(loc).padEnd(46) + pc.cyan('│'));
          } else {
            console.log(pc.cyan('│') + '    ' + pc.dim('○') + ' ' + pc.white('Antigravity:') + ' ' + pc.dim('not configured (run mcp:setup)').padEnd(46) + pc.cyan('│'));
          }

          if (hasCursor) {
            console.log(pc.cyan('│') + '    ' + pc.green('✔') + ' ' + pc.white('Cursor:     ') + ' ' + pc.dim('.cursor/mcp.json').padEnd(46) + pc.cyan('│'));
          } else {
            console.log(pc.cyan('│') + '    ' + pc.dim('○') + ' ' + pc.white('Cursor:     ') + ' ' + pc.dim('not configured (run mcp:setup)').padEnd(46) + pc.cyan('│'));
          }

          console.log(pc.cyan('│') + '                                                                ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '  ' + pc.dim('Registered Tools:') + '                                             ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '    • ' + pc.magenta('get_project_context') + pc.dim('      Overview of stack & components') + '       ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '    • ' + pc.magenta('search_project_memory') + pc.dim('    Query semantic code memory    ') + '       ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '    • ' + pc.magenta('get_architecture') + pc.dim('         Structural components & deps  ') + '       ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '    • ' + pc.magenta('get_technical_decisions') + pc.dim(' Accepted ADRs & decisions   ') + '       ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '    • ' + pc.magenta('get_project_conventions') + pc.dim(' Coding rules & conventions   ') + '       ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '    • ' + pc.magenta('record_technical_decision') + pc.dim('AI records new decisions     ') + '       ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '                                                                ' + pc.cyan('│'));
          console.log(pc.cyan('│') + '  ' + pc.dim('Your AI coding agents call these tools automatically.') + '        ' + pc.cyan('│'));
          console.log(pc.cyan('└──────────────────────────────────────────────────────────────┘\n'));
          state = this.store.readState();
          break;
        }

        case 'search':
          handleSearch(args);
          break;

        case 'interview': {
          const { TerminalInterviewRunner } = await import('./interview-runner.js');
          const runner = new TerminalInterviewRunner(this.projectRoot);
          await runner.runSession(rl);
          state = this.store.readState();
          this.renderBanner(state);
          break;
        }

        case 'help':
          printHelp();
          break;

        case 'ask':
        default: {
          const query = cmd?.toLowerCase() === 'ask' ? args.join(' ') : input;
          await handleAsk([query]);
          break;
        }
      }

      rl.prompt();
    });
  }
}

function parseCommandLine(text: string): string[] {
  const matches = text.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
  if (!matches) return [];
  return matches.map((arg) => {
    if (
      (arg.startsWith('"') && arg.endsWith('"') && arg.length >= 2) ||
      (arg.startsWith("'") && arg.endsWith("'") && arg.length >= 2)
    ) {
      return arg.slice(1, -1);
    }
    return arg;
  });
}
