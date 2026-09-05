import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  LocalStructuredMemoryStore,
  LocalSemanticMemoryStore,
  type StructuredMemoryState,
  type ArchitectureComponent,
  type SemanticMemoryChunk,
} from '@project-memory/core';
import { scanRepository } from './file-scanner.js';
import { detectTechStack } from './tech-detector.js';

export interface AnalysisSummary {
  filesScanned: number;
  techStackCount: number;
  componentsFound: number;
  semanticChunksCreated: number;
}

export class ProjectAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  public analyze(): AnalysisSummary {
    const files = scanRepository(this.projectRoot);
    const techStack = detectTechStack(this.projectRoot);

    // Architecture components detected based on directory layouts
    const components: ArchitectureComponent[] = [];

    const hasPackages = files.some((f) => f.relativePath.startsWith('packages/'));
    const hasApps = files.some((f) => f.relativePath.startsWith('apps/'));
    const hasSrc = files.some((f) => f.relativePath.startsWith('src/'));

    if (hasPackages || hasApps) {
      // Monorepo architecture
      const packageDirs = new Set<string>();
      for (const f of files) {
        const match = f.relativePath.match(/^(packages|apps)\/([^/]+)/);
        if (match && match[2]) {
          packageDirs.add(`${match[1]}/${match[2]}`);
        }
      }

      for (const pkgDir of packageDirs) {
        const [kind, name] = pkgDir.split('/');
        const pkgJsonPath = path.join(this.projectRoot, pkgDir, 'package.json');
        let description = `Internal monorepo component located at ${pkgDir}`;
        const entrypoints: string[] = [];
        const internalDeps: string[] = [];

        if (fs.existsSync(pkgJsonPath)) {
          try {
            const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
            if (pkgData.description) {
              description = pkgData.description;
            }
            if (pkgData.bin) {
              if (typeof pkgData.bin === 'string') {
                entrypoints.push(`${pkgDir}/${pkgData.bin}`);
              } else {
                for (const b of Object.values(pkgData.bin)) {
                  entrypoints.push(`${pkgDir}/${b}`);
                }
              }
            }
            if (pkgData.main) {
              entrypoints.push(`${pkgDir}/${pkgData.main}`);
            }

            const allDeps = { ...pkgData.dependencies, ...pkgData.devDependencies };
            for (const depName of Object.keys(allDeps)) {
              for (const otherPkg of packageDirs) {
                const otherName = otherPkg.split('/')[1];
                if (otherName && depName.includes(otherName) && otherName !== name) {
                  internalDeps.push(otherPkg);
                }
              }
            }
          } catch {
            // ignore JSON error
          }
        }

        // Check common source entrypoints
        const commonSrcFiles = [
          `${pkgDir}/src/index.ts`,
          `${pkgDir}/src/index.js`,
          `${pkgDir}/src/main.ts`,
          `${pkgDir}/src/app.tsx`,
          `${pkgDir}/src/app.ts`,
          `${pkgDir}/app/layout.tsx`,
          `${pkgDir}/pages/index.tsx`,
        ];
        for (const candidate of commonSrcFiles) {
          if (files.some((f) => f.relativePath === candidate) && !entrypoints.includes(candidate)) {
            entrypoints.push(candidate);
          }
        }

        components.push({
          id: `comp-${name}`,
          name: `${name} (${kind})`,
          type: kind === 'apps' ? 'frontend' : 'module',
          description,
          entrypoints: entrypoints.length > 0 ? entrypoints : undefined,
          responsibilities: [`Handles ${name} capabilities`],
          dependencies: Array.from(new Set(internalDeps)),
          sources: [{ type: 'source-code', reference: pkgDir }],
        });
      }
    } else if (hasSrc) {
      const entrypoints: string[] = [];
      const commonSrc = ['src/index.ts', 'src/index.js', 'src/main.ts', 'src/app.ts', 'src/server.ts'];
      for (const candidate of commonSrc) {
        if (files.some((f) => f.relativePath === candidate)) {
          entrypoints.push(candidate);
        }
      }

      components.push({
        id: 'comp-src',
        name: 'Main Application',
        type: 'module',
        description: 'Core application logic located in src/',
        entrypoints: entrypoints.length > 0 ? entrypoints : undefined,
        responsibilities: ['Primary application logic'],
        dependencies: [],
        sources: [{ type: 'source-code', reference: 'src/' }],
      });
    }

    // Persist structured state
    const structuredStore = new LocalStructuredMemoryStore({ projectRoot: this.projectRoot });
    const existingState = structuredStore.readState();

    const projectName = existingState?.identity.name ?? path.basename(this.projectRoot);
    const version = existingState?.identity.version ?? '0.1.0';
    const now = new Date().toISOString();

    const newState: StructuredMemoryState = {
      identity: {
        name: projectName,
        version: version,
        description: existingState?.identity.description ?? 'Analyzed software project',
        rootPath: this.projectRoot,
        createdAt: existingState?.identity.createdAt ?? now,
        updatedAt: now,
      },
      techStack,
      components,
      decisions: existingState?.decisions ?? [],
      notes: existingState?.notes ?? [],
      conventions: existingState?.conventions ?? [],
      discrepancies: existingState?.discrepancies ?? [],
    };

    structuredStore.saveState(newState);

    // Generate semantic chunks for knowledge retrieval
    const semanticStore = new LocalSemanticMemoryStore(this.projectRoot);
    let chunksCreated = 0;

    // 1. Tech stack summary chunk
    if (techStack.length > 0) {
      const chunk: SemanticMemoryChunk = {
        id: 'tech-stack-overview',
        title: 'Technology Stack Overview',
        category: 'architecture',
        content: `The project uses ${techStack.map((t) => `${t.name} (${t.category})`).join(', ')}.`,
        tags: ['stack', 'technologies', ...techStack.map((t) => t.name.toLowerCase())],
        sources: techStack.map((t) => t.source),
        updatedAt: now,
      };
      semanticStore.saveChunk(chunk);
      chunksCreated++;
    }

    // 2. Readme chunk if README exists
    const readmeFile = files.find((f) => /^readme\.md$/i.test(f.relativePath));
    if (readmeFile) {
      const readmeContent = fs.readFileSync(readmeFile.absolutePath, 'utf-8');
      const chunk: SemanticMemoryChunk = {
        id: 'project-readme-summary',
        title: 'Project README Documentation',
        category: 'setup',
        content: readmeContent.slice(0, 2000), // First 2000 characters for token efficiency
        tags: ['readme', 'docs', 'overview'],
        sources: [{ type: 'documentation', reference: readmeFile.relativePath }],
        updatedAt: now,
      };
      semanticStore.saveChunk(chunk);
      chunksCreated++;
    }

    return {
      filesScanned: files.length,
      techStackCount: techStack.length,
      componentsFound: components.length,
      semanticChunksCreated: chunksCreated,
    };
  }
}
