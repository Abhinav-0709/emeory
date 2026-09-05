import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  LocalStructuredMemoryStore,
  LocalSemanticMemoryStore,
  type StructuredMemoryState,
  type ArchitectureComponent,
  type SemanticMemoryChunk,
  type KnowledgeDiscrepancy,
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

    // Inspect root package manifests or README for project identity & metadata
    let realName = existingState?.identity.name;
    let realVersion = existingState?.identity.version;
    let realDescription = existingState?.identity.description;
    let rootScripts: Record<string, string> | undefined;
    let rootKeywords: string[] = [];

    const rootPkgPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(rootPkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
        if (pkg.name && (!realName || realName === path.basename(this.projectRoot))) {
          realName = pkg.name;
        }
        if (pkg.version && (!realVersion || realVersion === '0.1.0')) {
          realVersion = pkg.version;
        }
        if (pkg.description && (!realDescription || realDescription === 'Software project managed with Emeory' || realDescription === 'Analyzed software project')) {
          realDescription = pkg.description;
        }
        if (pkg.scripts) {
          rootScripts = pkg.scripts;
        }
        if (Array.isArray(pkg.keywords)) {
          rootKeywords = pkg.keywords;
        }
      } catch {
        // ignore JSON parse error
      }
    }

    const projectName = realName ?? path.basename(this.projectRoot);
    const version = realVersion ?? '0.1.0';
    const now = new Date().toISOString();

    // Detect discrepancies (technology drift and orphaned file references)
    const discrepancies: KnowledgeDiscrepancy[] = [];
    const detectedTechLower = new Set(techStack.map((t) => t.name.toLowerCase()));
    const trackedTech = ['redis', 'supabase', 'postgres', 'sqlite', 'mongodb', 'mysql', 'firebase', 'tailwind', 'graphql', 'prisma', 'drizzle'];

    const scannedRelativePaths = new Set(files.map((f) => f.relativePath.replace(/\\/g, '/')));

    for (const d of existingState?.decisions ?? []) {
      const text = `${d.title} ${d.decision} ${d.rationale}`.toLowerCase();
      
      // 1. Dependency drift detection
      for (const tech of trackedTech) {
        if (text.includes(tech) && !Array.from(detectedTechLower).some((t) => t.includes(tech))) {
          discrepancies.push({
            id: `disc-${d.id}-${tech}`,
            topic: `${tech.toUpperCase()} dependency drift`,
            claimedByDoc: {
              statement: `Decision ${d.id} ("${d.title}") mentions ${tech}, but ${tech} was not found in project dependencies.`,
              source: d.source,
            },
            actualInCode: {
              statement: `No ${tech} package or config detected in repository manifests.`,
              source: { type: 'config', reference: 'package manifests' },
            },
            detectedAt: now,
          });
        }
      }

      // 2. Orphaned file reference detection (Risk #2: File rename / deletion without losing decision)
      const ref = d.source?.reference?.replace(/\\/g, '/');
      if (ref && (ref.startsWith('src/') || ref.startsWith('packages/') || ref.endsWith('.ts') || ref.endsWith('.js') || ref.endsWith('.go') || ref.endsWith('.rs') || ref.endsWith('.py'))) {
        if (!scannedRelativePaths.has(ref) && !fs.existsSync(path.resolve(this.projectRoot, ref))) {
          // Check for possible file renames (same directory or moved with same/similar name)
          const targetBasename = path.basename(ref);
          const targetBaseNoExt = targetBasename.split('.')[0] || targetBasename;
          const targetDir = path.dirname(ref);

          const candidate = files.find((f) => {
            const fRel = f.relativePath.replace(/\\/g, '/');
            const fDir = path.dirname(fRel);
            const fBase = path.basename(fRel);
            if (fRel === ref) return false;
            // 1. Same directory rename (e.g. login.ts -> signin.ts in src/auth)
            if (fDir === targetDir) return true;
            // 2. Moved to another directory with same basename or similar name
            return fBase === targetBasename || (targetBaseNoExt.length >= 3 && fBase.includes(targetBaseNoExt));
          });

          discrepancies.push({
            id: `disc-orphan-${d.id}`,
            topic: 'Orphaned file reference in decision',
            claimedByDoc: {
              statement: `Decision ${d.id} ("${d.title}") references file "${ref}".`,
              source: d.source,
            },
            actualInCode: {
              statement: candidate
                ? `File "${ref}" was not found. Possible rename detected: "${candidate.relativePath.replace(/\\/g, '/')}".`
                : `File "${ref}" was deleted or moved.`,
              source: { type: 'source-code', reference: candidate ? candidate.relativePath : ref },
            },
            detectedAt: now,
          });
        }
      }
    }

    // Check README for description fallback and section parsing
    const readmeFile = files.find((f) => /^readme\.md$/i.test(f.relativePath));
    let readmeSections: Array<{ heading: string; content: string }> = [];

    if (readmeFile) {
      try {
        const rawReadme = fs.readFileSync(readmeFile.absolutePath, 'utf-8');
        // Extract first descriptive text for description if still generic
        if (!realDescription || realDescription === 'Software project managed with Emeory' || realDescription === 'Analyzed software project') {
          const lines = rawReadme.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('[') && !trimmed.startsWith('!') && !trimmed.startsWith('```')) {
              realDescription = trimmed.replace(/^>\s*/, '').slice(0, 160);
              break;
            }
          }
        }

        // Parse markdown sections
        const lines = rawReadme.split('\n');
        let currentHeading = 'Overview';
        let currentLines: string[] = [];

        for (const line of lines) {
          const match = line.match(/^#{1,3}\s+(.+)$/);
          if (match && match[1]) {
            if (currentLines.length > 0) {
              readmeSections.push({
                heading: currentHeading,
                content: currentLines.join('\n').trim(),
              });
              currentLines = [];
            }
            currentHeading = match[1].replace(/[\*_`]/g, '').trim();
          } else {
            currentLines.push(line);
          }
        }
        if (currentLines.length > 0) {
          readmeSections.push({
            heading: currentHeading,
            content: currentLines.join('\n').trim(),
          });
        }
      } catch {
        // ignore README read errors
      }
    }

    const newState: StructuredMemoryState = {
      identity: {
        name: projectName,
        version: version,
        description: realDescription || 'Software project managed with Emeory',
        rootPath: this.projectRoot,
        createdAt: existingState?.identity.createdAt ?? now,
        updatedAt: now,
      },
      techStack,
      components,
      decisions: existingState?.decisions ?? [],
      notes: existingState?.notes ?? [],
      conventions: existingState?.conventions ?? [],
      discrepancies,
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

    // 2. Structured README sections chunks
    if (readmeSections.length > 0 && readmeFile) {
      for (const [i, sec] of readmeSections.entries()) {
        if (!sec || !sec.content || sec.content.length < 15) continue;

        const hLower = sec.heading.toLowerCase();
        let chunkId = `readme-sec-${i}`;
        let category: SemanticMemoryChunk['category'] = 'setup';
        let tags = ['readme', 'docs'];

        if (/overview|about|intro|what is/i.test(hLower) || sec.heading === 'Overview') {
          chunkId = 'project-readme-overview';
          category = 'setup';
          tags = ['overview', 'about', 'introduction', 'purpose', 'summary', 'project'];
        } else if (/feature|capabilit|highlight|what (?:it|this) does|function/i.test(hLower)) {
          chunkId = 'project-readme-features';
          category = 'architecture';
          tags = ['features', 'capabilities', 'highlights', 'functions', 'what it does'];
        } else if (/architect|how it works|design|structure|data flow/i.test(hLower)) {
          chunkId = 'project-readme-architecture';
          category = 'architecture';
          tags = ['architecture', 'design', 'structure', 'dataflow'];
        } else if (/quickstart|get(?:ting)? started|usage|command|cli/i.test(hLower)) {
          chunkId = 'project-readme-usage';
          category = 'setup';
          tags = ['usage', 'quickstart', 'commands', 'getting-started'];
        }

        const chunk: SemanticMemoryChunk = {
          id: chunkId,
          title: sec.heading,
          category,
          content: sec.content.slice(0, 3000),
          tags,
          sources: [{ type: 'documentation', reference: readmeFile.relativePath }],
          updatedAt: now,
        };
        semanticStore.saveChunk(chunk);
        chunksCreated++;
      }
    }

    // 3. Project scripts & capabilities chunk
    if (rootScripts && Object.keys(rootScripts).length > 0) {
      const scriptEntries = Object.entries(rootScripts).map(([cmd, script]) => `- \`npm run ${cmd}\`: ${script}`);
      const chunk: SemanticMemoryChunk = {
        id: 'project-runnable-tasks',
        title: 'Project Commands & Runnable Tasks',
        category: 'setup',
        content: `Available runnable tasks in project package manifest:\n${scriptEntries.join('\n')}`,
        tags: ['scripts', 'commands', 'tasks', 'run', 'capabilities', 'features'],
        sources: [{ type: 'config', reference: 'package.json' }],
        updatedAt: now,
      };
      semanticStore.saveChunk(chunk);
      chunksCreated++;
    }

    // 4. Project keywords / domain tags
    if (rootKeywords.length > 0) {
      const chunk: SemanticMemoryChunk = {
        id: 'project-keywords-domain',
        title: 'Project Domain & Topic Keywords',
        category: 'architecture',
        content: `Project topic tags: ${rootKeywords.join(', ')}`,
        tags: ['keywords', 'tags', 'topics', ...rootKeywords],
        sources: [{ type: 'config', reference: 'package.json' }],
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
