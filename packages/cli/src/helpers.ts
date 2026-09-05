import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec, spawn } from 'node:child_process';
import pc from 'picocolors';

export function openBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      exec(`start "" "${url}"`);
    } else if (platform === 'darwin') {
      exec(`open "${url}"`);
    } else {
      exec(`xdg-open "${url}"`);
    }
  } catch {
    // If opening browser fails, ignore
  }
}

export async function getWebInterfaceUrl(): Promise<string> {
  try {
    const res = await fetch('http://localhost:3000', { signal: AbortSignal.timeout(200) });
    if (res.ok || res.status < 500) {
      return 'http://localhost:3000';
    }
  } catch {}

  try {
    const res = await fetch('http://localhost:5173', { signal: AbortSignal.timeout(200) });
    if (res.ok || res.status < 500) {
      return 'http://localhost:5173';
    }
  } catch {}

  return 'http://localhost:3000';
}

export function isMcpRunning(projectRoot: string): boolean {
  const pidFile = path.join(projectRoot, '.emeory', 'mcp.pid');
  if (fs.existsSync(pidFile)) {
    try {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10);
      if (pid && !isNaN(pid)) {
        globalThis.process.kill(pid, 0);
        return true;
      }
    } catch {
      try {
        fs.unlinkSync(pidFile);
      } catch {}
    }
  }
  return false;
}

export function getMcpDisplayInfo(projectRoot: string): {
  isRunning: boolean;
  isConfigured: boolean;
  displayValue: string;
} {
  const isRunning = isMcpRunning(projectRoot);
  if (isRunning) {
    return {
      isRunning: true,
      isConfigured: true,
      displayValue: pc.green('active'),
    };
  }

  const cursorMcp = path.join(projectRoot, '.cursor', 'mcp.json');
  const agentsMcp = path.join(projectRoot, '.agents', 'mcp_config.json');
  const userHome = process.env.USERPROFILE || process.env.HOME || '';
  const globalMcp = path.join(userHome, '.gemini', 'config', 'mcp_config.json');

  const hasCursor = fs.existsSync(cursorMcp);
  const hasAgents = fs.existsSync(agentsMcp);
  const hasGlobal = fs.existsSync(globalMcp);

  if (hasCursor || hasAgents || hasGlobal) {
    const clients: string[] = [];
    if (hasAgents || hasGlobal) clients.push('Antigravity');
    if (hasCursor) clients.push('Cursor');
    return {
      isRunning: false,
      isConfigured: true,
      displayValue: pc.green('ready') + pc.dim(` (${clients.join(' & ')})`),
    };
  }

  return {
    isRunning: false,
    isConfigured: false,
    displayValue: pc.red('not running') + pc.dim(" (run 'emeory mcp')"),
  };
}

export function recordMcpPid(projectRoot: string): void {
  try {
    const emeoryDir = path.join(projectRoot, '.emeory');
    if (!fs.existsSync(emeoryDir)) {
      fs.mkdirSync(emeoryDir, { recursive: true });
    }
    const pidFile = path.join(emeoryDir, 'mcp.pid');
    fs.writeFileSync(pidFile, String(globalThis.process.pid), 'utf-8');

    const cleanup = () => {
      try {
        if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
      } catch {}
    };

    const proc = globalThis.process;
    if (proc && typeof proc.on === 'function') {
      proc.on('exit', cleanup);
      proc.on('SIGINT', () => {
        cleanup();
        proc.exit(0);
      });
      proc.on('SIGTERM', () => {
        cleanup();
        proc.exit(0);
      });
    }
  } catch {}
}

export function startMcpDaemon(projectRoot: string): number {
  try {
    const cliPath = path.join(projectRoot, 'packages', 'cli', 'dist', 'index.js');
    const child = spawn(globalThis.process.execPath, [cliPath, 'mcp'], {
      detached: true,
      stdio: 'ignore',
      cwd: projectRoot,
    });
    child.unref();
    if (child.pid) {
      const emeoryDir = path.join(projectRoot, '.emeory');
      if (!fs.existsSync(emeoryDir)) {
        fs.mkdirSync(emeoryDir, { recursive: true });
      }
      fs.writeFileSync(path.join(emeoryDir, 'mcp.pid'), String(child.pid), 'utf-8');
      return child.pid;
    }
  } catch {}
  return 0;
}
