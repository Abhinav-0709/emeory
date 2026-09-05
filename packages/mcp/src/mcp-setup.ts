import * as fs from 'node:fs';
import * as path from 'node:path';

export type McpClientTarget = 'cursor' | 'claude' | 'antigravity' | 'all';

export interface SetupOptions {
  projectRoot: string;
  target: McpClientTarget;
}

export function generateMcpConfigSnippet(projectRoot: string) {
  const localCliScript = path.join(projectRoot, 'packages', 'cli', 'dist', 'index.js');
  const isLocalMonorepo = fs.existsSync(localCliScript);
  const normalizedRoot = projectRoot.replace(/\\/g, '/');

  if (isLocalMonorepo) {
    return {
      mcpServers: {
        emeory: {
          command: 'node',
          args: [localCliScript.replace(/\\/g, '/'), 'mcp'],
          cwd: normalizedRoot,
        },
      },
    };
  }

  return {
    mcpServers: {
      emeory: {
        command: 'npx',
        args: ['-y', 'emeory', 'mcp'],
        cwd: normalizedRoot,
      },
    },
  };
}

export function autoConfigureMcp(options: SetupOptions): {
  configuredFiles: string[];
  instructions: string[];
} {
  const { projectRoot, target } = options;
  const configSnippet = generateMcpConfigSnippet(projectRoot);
  const configuredFiles: string[] = [];
  const instructions: string[] = [];

  // 1. Cursor: .cursor/mcp.json
  if (target === 'cursor' || target === 'all') {
    const cursorDir = path.join(projectRoot, '.cursor');
    const cursorMcpPath = path.join(cursorDir, 'mcp.json');

    try {
      if (!fs.existsSync(cursorDir)) {
        fs.mkdirSync(cursorDir, { recursive: true });
      }

      let existingConfig: any = { mcpServers: {} };
      if (fs.existsSync(cursorMcpPath)) {
        try {
          existingConfig = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf-8'));
          if (!existingConfig.mcpServers) existingConfig.mcpServers = {};
        } catch {
          // overwrite if invalid json
        }
      }

      existingConfig.mcpServers['emeory'] = configSnippet.mcpServers['emeory'];
      fs.writeFileSync(cursorMcpPath, JSON.stringify(existingConfig, null, 2), 'utf-8');
      configuredFiles.push(cursorMcpPath);
    } catch (err: any) {
      instructions.push(`Failed to auto-write .cursor/mcp.json: ${err?.message}`);
    }
  }

  // 2. Antigravity / Agent Workspace: .agents/mcp_config.json
  if (target === 'antigravity' || target === 'all') {
    const agentDir = path.join(projectRoot, '.agents');
    const agentMcpPath = path.join(agentDir, 'mcp_config.json');

    try {
      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }

      let existingConfig: any = { mcpServers: {} };
      if (fs.existsSync(agentMcpPath)) {
        try {
          existingConfig = JSON.parse(fs.readFileSync(agentMcpPath, 'utf-8'));
          if (!existingConfig.mcpServers) existingConfig.mcpServers = {};
        } catch {
          // ignore
        }
      }

      existingConfig.mcpServers['emeory'] = configSnippet.mcpServers['emeory'];
      fs.writeFileSync(agentMcpPath, JSON.stringify(existingConfig, null, 2), 'utf-8');
      configuredFiles.push(agentMcpPath);
    } catch (err: any) {
      instructions.push(`Failed to auto-write .agents/mcp_config.json: ${err?.message}`);
    }
  }

  // 3. Global claude desktop / Claude Code guide
  const claudeSnippet = JSON.stringify(configSnippet, null, 2);
  instructions.push(`For Claude Desktop / Claude Code, paste this into your claude_desktop_config.json:\n${claudeSnippet}`);

  return { configuredFiles, instructions };
}
