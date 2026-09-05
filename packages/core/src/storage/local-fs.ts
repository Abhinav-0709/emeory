import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  StructuredMemoryState,
  ProjectIdentity,
  TechStackFact,
  ArchitectureComponent,
  TechnicalDecision,
  ProjectConvention,
  KnowledgeDiscrepancy,
} from '../types/index.js';

export const MEMORY_DIR_NAME = '.emeory';

export interface FileStorageOptions {
  projectRoot: string;
}

export class LocalStructuredMemoryStore {
  private memoryDir: string;

  constructor(options: FileStorageOptions) {
    // Prefer .emeory if exists, fallback to .project-memory if legacy exists, default to .emeory
    const newDir = path.join(options.projectRoot, '.emeory');
    const legacyDir = path.join(options.projectRoot, '.project-memory');
    if (!fs.existsSync(newDir) && fs.existsSync(legacyDir)) {
      this.memoryDir = legacyDir;
    } else {
      this.memoryDir = newDir;
    }
  }

  public getMemoryDir(): string {
    return this.memoryDir;
  }

  public exists(): boolean {
    return fs.existsSync(this.memoryDir) && fs.existsSync(path.join(this.memoryDir, 'manifest.json'));
  }

  public initialize(identity: ProjectIdentity): void {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }

    const subdirs = ['knowledge', 'index', 'history'];
    for (const sub of subdirs) {
      const fullPath = path.join(this.memoryDir, sub);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    this.writeJson('manifest.json', identity);
    this.writeJson('tech-stack.json', []);
    this.writeJson('architecture.json', []);
    this.writeJson('decisions.json', []);
    this.writeJson('notes.json', []);
    this.writeJson('conventions.json', []);
    this.writeJson('discrepancies.json', []);
  }

  public readState(): StructuredMemoryState | null {
    if (!this.exists()) {
      return null;
    }

    const identity = this.readJson<ProjectIdentity>('manifest.json');
    const techStack = this.readJson<TechStackFact[]>('tech-stack.json') ?? [];
    const components = this.readJson<ArchitectureComponent[]>('architecture.json') ?? [];
    const decisions = this.readJson<TechnicalDecision[]>('decisions.json') ?? [];
    const notes = this.readJson<any[]>('notes.json') ?? [];
    const conventions = this.readJson<ProjectConvention[]>('conventions.json') ?? [];
    const discrepancies = this.readJson<KnowledgeDiscrepancy[]>('discrepancies.json') ?? [];

    if (!identity) {
      return null;
    }

    return {
      identity,
      techStack,
      components,
      decisions,
      notes,
      conventions,
      discrepancies,
    };
  }

  public saveState(state: StructuredMemoryState): void {
    if (!fs.existsSync(this.memoryDir)) {
      this.initialize(state.identity);
    }
    this.writeJson('manifest.json', state.identity);
    this.writeJson('tech-stack.json', state.techStack);
    this.writeJson('architecture.json', state.components);
    this.writeJson('decisions.json', state.decisions);
    this.writeJson('notes.json', state.notes ?? []);
    this.writeJson('conventions.json', state.conventions);
    this.writeJson('discrepancies.json', state.discrepancies);
  }

  private writeJson(fileName: string, data: unknown): void {
    const filePath = path.join(this.memoryDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private readJson<T>(fileName: string): T | null {
    const filePath = path.join(this.memoryDir, fileName);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }
}
