import * as fs from 'node:fs';
import * as path from 'node:path';
import { isSensitiveFile } from './secret-detector.js';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.project-memory',
  '.emeory',
]);

export interface ScannedFile {
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
  extension: string;
}

export function scanRepository(projectRoot: string): ScannedFile[] {
  const results: ScannedFile[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(projectRoot, fullPath);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (!isSensitiveFile(fullPath)) {
          const stats = fs.statSync(fullPath);
          results.push({
            relativePath: relPath.replace(/\\/g, '/'),
            absolutePath: fullPath,
            sizeBytes: stats.size,
            extension: path.extname(entry.name).toLowerCase(),
          });
        }
      }
    }
  }

  walk(projectRoot);
  return results;
}
