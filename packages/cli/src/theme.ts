import pc from 'picocolors';
import type { StructuredMemoryState } from '@project-memory/core';

export function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export function padVisual(str: string, targetWidth: number): string {
  const visibleLength = stripAnsi(str).length;
  if (visibleLength > targetWidth) {
    // Truncate visible text cleanly if it exceeds the box width
    const diff = visibleLength - targetWidth + 3;
    return str.slice(0, Math.max(0, str.length - diff)) + '...';
  }
  const paddingNeeded = Math.max(0, targetWidth - visibleLength);
  return str + ' '.repeat(paddingNeeded);
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (stripAnsi(text).length <= maxWidth) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (stripAnsi(current + ' ' + word).length <= maxWidth) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function formatInlineMarkdown(text: string): string {
  // Replace <br> tags with indented newlines
  let formatted = text.replace(/<br\s*\/?>/gi, '\n      ');
  // Bold: **text**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, (_, m) => pc.bold(m));
  // Italic: *text*
  formatted = formatted.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (_, m) => pc.dim(m));
  // Code: `code`
  formatted = formatted.replace(/`([^`\n]+)`/g, (_, m) => pc.cyan(m));
  return formatted;
}

export function renderTerminalMarkdown(content: string, maxWidth = 96): void {
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? '';
    const trimmed = rawLine.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (inCodeBlock) {
        codeBlockLang = trimmed.slice(3).trim();
        console.log(pc.dim(`  ┌── Code ${codeBlockLang ? `(${codeBlockLang}) ` : ''}` + '─'.repeat(Math.max(0, maxWidth - 15 - codeBlockLang.length))));
      } else {
        console.log(pc.dim('  └──' + '─'.repeat(Math.max(0, maxWidth - 7))));
      }
      continue;
    }

    if (inCodeBlock) {
      console.log(pc.dim('  │ ') + pc.white(rawLine));
      continue;
    }

    // Markdown Table / Pipe-delimited row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Check if it's a separator line like |---|---|
      if (/^\|[-:\s|]+\|$/.test(trimmed)) {
        continue;
      }

      const rawCells = trimmed
        .slice(1, -1)
        .split('|')
        .map((s) => s.trim());

      // Universal markdown check: if next line is a separator like |---|---|, this is the header row
      const nextLine = (lines[i + 1] ?? '').trim();
      if (/^\|[-:\s|]+\|$/.test(nextLine)) {
        continue;
      }

      // Check if this is a header row by keyword
      const isHeader = rawCells.every((c) => {
        const clean = stripAnsi(c).replace(/[*_`]/g, '').trim().toLowerCase();
        return (
          /^(area|decision|rationale|why|constraint|principle|topic|name|impact|category|item|key|status|description|how|header|col)([\s/_\-–—]|$)/i.test(clean) ||
          clean === ''
        );
      });

      if (isHeader) continue;

      if (rawCells.length >= 2) {
        const col1 = formatInlineMarkdown(rawCells[0] ?? '');
        const col2 = formatInlineMarkdown(rawCells[1] ?? '');
        const col3 = rawCells[2] ? formatInlineMarkdown(rawCells[2]) : '';

        console.log(pc.cyan('  • ') + pc.bold(col1));
        const wrappedCol2 = wrapText(col2, maxWidth - 8);
        for (const line of wrappedCol2) {
          console.log('    ' + pc.white(line));
        }
        if (col3) {
          const wrappedCol3 = wrapText(col3, maxWidth - 10);
          console.log('    ' + pc.dim('↳ ') + pc.dim(wrappedCol3[0] ?? ''));
          for (let k = 1; k < wrappedCol3.length; k++) {
            console.log('      ' + pc.dim(wrappedCol3[k] ?? ''));
          }
        }
        console.log('');
        continue;
      }
    }

    // Bold section titles like **Decisions made** or **Constraints**
    const boldHeaderMatch = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (boldHeaderMatch) {
      console.log(pc.bold(pc.cyan(`\n◆ ${boldHeaderMatch[1]}\n`)));
      continue;
    }

    // Markdown Headers
    if (trimmed.startsWith('# ')) {
      console.log(pc.bold(pc.cyan(`\n■ ${trimmed.slice(2)}\n`)));
      continue;
    }
    if (trimmed.startsWith('## ')) {
      console.log(pc.bold(pc.blue(`\n▸ ${trimmed.slice(3)}\n`)));
      continue;
    }
    if (trimmed.startsWith('### ')) {
      console.log(pc.bold(pc.white(`\n• ${trimmed.slice(4)}\n`)));
      continue;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      console.log(pc.dim('  ' + '─'.repeat(Math.min(80, maxWidth - 4))));
      continue;
    }

    // Numbered List (e.g. 1. Item)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const num = numMatch[1];
      const rest = numMatch[2] ?? '';
      const formatted = formatInlineMarkdown(rest);
      const wrapped = wrapText(formatted, maxWidth - 8);
      console.log(pc.cyan(`  ${num}. `) + wrapped[0]);
      for (let w = 1; w < wrapped.length; w++) {
        console.log('     ' + wrapped[w]);
      }
      continue;
    }

    // Bullet List (e.g. - Item or * Item)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const formatted = formatInlineMarkdown(trimmed.slice(2));
      const wrapped = wrapText(formatted, maxWidth - 8);
      console.log(pc.cyan('  • ') + wrapped[0]);
      for (let w = 1; w < wrapped.length; w++) {
        console.log('    ' + wrapped[w]);
      }
      continue;
    }

    // Empty line
    if (!trimmed) {
      console.log('');
      continue;
    }

    // Regular paragraph text with inline formatting and word wrap
    const formatted = formatInlineMarkdown(rawLine);
    const wrapped = wrapText(formatted, maxWidth - 4);
    for (const w of wrapped) {
      console.log('  ' + w);
    }
  }
}

export function renderAnswerCard(answer: string, provider?: string, model?: string): void {
  const terminalWidth = process.stdout.columns || 100;
  const cardWidth = Math.min(100, Math.max(60, terminalWidth - 2));

  console.log('\n' + pc.cyan('╭─ ') + pc.bold(pc.white('Answer')) + ' ' + pc.cyan('─'.repeat(Math.max(0, cardWidth - 10))));
  console.log(pc.cyan('│'));

  renderTerminalMarkdown(answer, cardWidth);

  console.log(pc.cyan('│'));
  console.log(pc.cyan('╰' + '─'.repeat(Math.max(0, cardWidth - 2))));
  if (provider && model) {
    console.log(pc.dim(`  Provider: ${provider} │ Model: ${model}\n`));
  }
}

export function renderConfigBox(
  projectRoot: string,
  memoryDirExists: boolean,
  hasGemini: boolean,
  hasGroq: boolean,
  webUrl: string,
  mcpStatus: string
): void {
  const items = [
    { label: 'Project Root', value: pc.white(projectRoot) },
    {
      label: 'Memory Store',
      value: memoryDirExists ? pc.green('.emeory/ (active)') : pc.yellow('Not initialized'),
    },
    {
      label: 'AI Engine',
      value: hasGemini
        ? pc.green('Gemini API (active)')
        : hasGroq
        ? pc.green('Groq API (active)')
        : pc.cyan('Local Offline Engine (active)'),
    },
    { label: 'Engine Mode', value: pc.cyan('Local Offline (Deterministic + Semantic)') },
    { label: 'MCP Server', value: mcpStatus },
  ];

  const termWidth = process.stdout.columns || 80;
  const maxValWidth = Math.max(...items.map((it) => stripAnsi(it.value).length));
  const desiredWidth = Math.max(70, maxValWidth + 24);
  const width = Math.min(termWidth - 2, desiredWidth);

  const title = 'Emeory Configuration';
  const dashes = Math.max(0, width - 5 - title.length);
  const topBorder = pc.cyan('╭─ ') + pc.bold(pc.cyan(title)) + ' ' + pc.cyan('─'.repeat(dashes) + '╮');
  const bottomBorder = pc.cyan('╰' + '─'.repeat(width - 2) + '╯');

  console.log('\n' + topBorder);
  console.log(pc.cyan('│') + ' '.repeat(width - 2) + pc.cyan('│'));

  for (const it of items) {
    const labelFormatted = '  ' + pc.dim(it.label.padEnd(16)) + ' ';
    const content = labelFormatted + it.value;
    console.log(pc.cyan('│') + padVisual(content, width - 2) + pc.cyan('│'));
  }

  console.log(pc.cyan('│') + ' '.repeat(width - 2) + pc.cyan('│'));
  console.log(bottomBorder + '\n');
}

export function formatTimeAgo(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
}

export const EMEORY_LOGO = [
  "███████╗███╗   ███╗███████╗ ██████╗ ██████╗ ██╗   ██╗",
  "██╔════╝████╗ ████║██╔════╝██╔═══██╗██╔══██╗╚██╗ ██╔╝",
  "█████╗  ██╔████╔██║█████╗  ██║   ██║██████╔╝ ╚████╔╝ ",
  "██╔══╝  ██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██╗  ╚██╔╝  ",
  "███████╗██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║   ██║   ",
  "╚══════╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ",
];

export function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.substring(0, 2), 16),
    g: parseInt(value.substring(2, 4), 16),
    b: parseInt(value.substring(4, 6), 16),
  };
}

export function gradientText(
  text: string,
  startHex = "#55C7F7",
  endHex = "#9B6CFF"
) {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);
  const characters = [...text];

  return characters
    .map((char, index) => {
      if (char === " ") return " ";
      const progress =
        characters.length <= 1
          ? 0
          : index / (characters.length - 1);
      const r = Math.round(start.r + (end.r - start.r) * progress);
      const g = Math.round(start.g + (end.g - start.g) * progress);
      const b = Math.round(start.b + (end.b - start.b) * progress);
      return `\x1b[38;2;${r};${g};${b}m${char}\x1b[0m`;
    })
    .join("");
}

export function renderHeader(version = 'v0.1.0'): void {
  const sloganLines = [
    pc.dim('                                                      Remember more.'),
    pc.dim('                                                      Build further.\n'),
  ];

  for (const sl of sloganLines) {
    console.log(sl);
  }

  for (let i = 0; i < EMEORY_LOGO.length; i++) {
    const line = EMEORY_LOGO[i] ?? '';
    if (i === 2) {
      console.log(gradientText(line) + '  ' + pc.dim(version));
    } else {
      console.log(gradientText(line));
    }
  }

  console.log(pc.white('\nPersistent memory for your code.'));
  console.log(pc.dim('Built for developers. Designed for AI.\n'));
}

export function getQuickCommandsBoxLines(width = 54): string[] {
  const topBorder = pc.blue('╭─ ') + pc.cyan('ⓘ Quick Commands') + ' ' + pc.blue('─'.repeat(Math.max(0, width - 21)) + '╮');
  const bottomBorder = pc.blue('╰' + '─'.repeat(width - 2) + '╯');

  const cmds = [
    { name: 'init', desc: 'Initialize Emeory in this project' },
    { name: 'status', desc: 'Show project memory status' },
    { name: 'add', desc: 'Add a note / decision / context' },
    { name: 'search', desc: 'Search project memory' },
    { name: 'ask', desc: 'Ask questions about codebase' },
    { name: 'mcp', desc: 'Start the MCP server' },
    { name: 'sync', desc: 'Re-index and update memory' },
    { name: 'config', desc: 'Configure settings & API keys' },
    { name: 'help', desc: 'Show all commands' },
  ];

  const lines: string[] = [topBorder];
  lines.push(pc.blue('│') + ' '.repeat(width - 2) + pc.blue('│'));

  for (const c of cmds) {
    const formattedCmd = pc.magenta(c.name.padEnd(8));
    const formattedDesc = pc.dim(c.desc);
    const content = '  ' + formattedCmd + '  ' + formattedDesc;
    lines.push(pc.blue('│') + padVisual(content, width - 2) + pc.blue('│'));
  }

  lines.push(pc.blue('│') + ' '.repeat(width - 2) + pc.blue('│'));
  lines.push(bottomBorder);
  return lines;
}

export function getStatusBoxLines(
  state: StructuredMemoryState,
  filesCount: number,
  mcpDisplay: string = pc.green('ready') + pc.dim(' (Cursor & Antigravity)'),
  _webUrl = 'http://localhost:3000',
  width = 72,
  targetHeight = 15
): string[] {
  const topBorder = pc.blue('╭─ ') + pc.green('●') + ' ' + pc.cyan('Project Memory Status') + ' ' + pc.blue('─'.repeat(Math.max(0, width - 28)) + '╮');
  const bottomBorder = pc.blue('╰' + '─'.repeat(width - 2) + '╯');

  const timeAgo = formatTimeAgo(state.identity.updatedAt);
  const decisionsCount = state.decisions.length;
  const notesCount = state.notes?.length || 0;
  const archCount = state.components.length;
  const otherCount = state.techStack.length;
  const totalItems = decisionsCount + notesCount + archCount + otherCount;

  const lines: string[] = [topBorder];
  lines.push(pc.blue('│') + ' '.repeat(width - 2) + pc.blue('│'));

  const items = [
    { label: 'Status', value: pc.green('Ready') },
    { label: 'Project', value: pc.white(state.identity.name) },
    { label: 'Files Indexed', value: pc.white(String(filesCount)) },
    { label: 'Last Sync', value: pc.white(timeAgo) },
    {
      label: 'Memory Items',
      value: pc.magenta(String(totalItems)) + ' ' + pc.dim(`(${decisionsCount} decisions, ${notesCount} notes, ${archCount} architecture, ${otherCount} tech stack)`),
    },
    { label: 'Engine Mode', value: pc.cyan('Local Offline') + pc.dim(' (zero-daemon)') },
    {
      label: 'MCP Server',
      value: mcpDisplay,
    },
    {
      label: 'Discrepancies',
      value:
        state.discrepancies && state.discrepancies.length > 0
          ? pc.yellow(`${state.discrepancies.length} detected`) + pc.dim(' (drift / orphaned files)')
          : pc.green('0') + pc.dim(' (in sync)'),
    },
  ];

  for (const item of items) {
    const labelFormatted = '  ' + pc.dim(item.label.padEnd(14)) + ' ';
    const content = labelFormatted + item.value;
    lines.push(pc.blue('│') + padVisual(content, width - 2) + pc.blue('│'));
  }

  lines.push(pc.blue('│') + ' '.repeat(width - 2) + pc.blue('│'));
  lines.push(bottomBorder);
  return lines;
}

export function getTipsBoxLines(width = 46): string[] {
  const topBorder = pc.blue('╭─ ') + pc.cyan('ⓘ Tips') + ' ' + pc.blue('─'.repeat(Math.max(0, width - 11)) + '╮');
  const bottomBorder = pc.blue('╰' + '─'.repeat(width - 2) + '╯');

  const lines: string[] = [topBorder];
  lines.push(pc.blue('│') + ' '.repeat(width - 2) + pc.blue('│'));

  const bullet1 = '  • ' + pc.dim('Use ') + pc.cyan('`emeory add`') + pc.dim(' to capture');
  const bullet1b = '    ' + pc.dim('important decisions while you code.');
  const bullet2 = '  • ' + pc.dim('Let AI agents access your project');
  const bullet2b = '    ' + pc.dim('memory via the MCP server.');
  const bullet3 = '  • ' + pc.dim('Run ') + pc.cyan('`emeory ask`') + pc.dim(' to query');
  const bullet3b = '    ' + pc.dim('architecture, decisions, and tech stack.');

  lines.push(pc.blue('│') + padVisual(bullet1, width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(bullet1b, width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(' ', width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(bullet2, width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(bullet2b, width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(' ', width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(bullet3, width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(bullet3b, width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual(' ', width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual('  ' + pc.dim('"Your code changes.'), width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual('  ' + pc.dim(' Your memory shouldn\'t."'), width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + padVisual('  ' + pc.dim(' — Emeory'), width - 2) + pc.blue('│'));
  lines.push(pc.blue('│') + ' '.repeat(width - 2) + pc.blue('│'));
  lines.push(bottomBorder);
  return lines;
}

export function equalizeBoxes(left: string[], right: string[]): { left: string[]; right: string[] } {
  const leftIsBox = left.length > 0 && stripAnsi(left[left.length - 1] ?? '').startsWith('╰');
  const rightIsBox = right.length > 0 && stripAnsi(right[right.length - 1] ?? '').startsWith('╰');

  const newLeft = [...left];
  const newRight = [...right];

  if (leftIsBox && rightIsBox) {
    const targetLen = Math.max(newLeft.length, newRight.length);
    const leftWidth = stripAnsi(newLeft[newLeft.length - 1] ?? '').length;
    const rightWidth = stripAnsi(newRight[newRight.length - 1] ?? '').length;

    while (newLeft.length < targetLen) {
      newLeft.splice(newLeft.length - 1, 0, pc.blue('│') + ' '.repeat(leftWidth - 2) + pc.blue('│'));
    }
    while (newRight.length < targetLen) {
      newRight.splice(newRight.length - 1, 0, pc.blue('│') + ' '.repeat(rightWidth - 2) + pc.blue('│'));
    }
  }

  return { left: newLeft, right: newRight };
}

export function renderSideBySide(leftLines: string[], rightLines: string[], gap = 3): void {
  const terminalWidth = process.stdout.columns || 130;
  const { left, right } = equalizeBoxes(leftLines, rightLines);
  const leftWidth = Math.max(...left.map((l) => stripAnsi(l).length), 1);
  const rightWidth = Math.max(...right.map((r) => stripAnsi(r).length), 1);

  if (terminalWidth >= leftWidth + rightWidth + gap) {
    const maxLines = Math.max(left.length, right.length);
    for (let i = 0; i < maxLines; i++) {
      const leftLine = left[i] ?? '';
      const leftPadded = padVisual(leftLine, leftWidth);
      const rightLine = right[i] || '';
      console.log(leftPadded + ' '.repeat(gap) + rightLine);
    }
  } else {
    // Stack neatly if terminal is narrow
    for (const l of leftLines) console.log(l);
    console.log('');
    for (const r of rightLines) console.log(r);
  }
}

