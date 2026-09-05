import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SemanticMemoryChunk } from '../types/index.js';
import { MEMORY_DIR_NAME } from './local-fs.js';

export interface SearchResult {
  chunk: SemanticMemoryChunk;
  score: number;
}

export class LocalSemanticMemoryStore {
  private knowledgeDir: string;
  private indexPath: string;

  constructor(projectRoot: string) {
    const newDir = path.join(projectRoot, '.emeory');
    const legacyDir = path.join(projectRoot, '.project-memory');
    const memoryDir = !fs.existsSync(newDir) && fs.existsSync(legacyDir) ? legacyDir : newDir;
    this.knowledgeDir = path.join(memoryDir, 'knowledge');
    this.indexPath = path.join(memoryDir, 'index', 'chunks.json');
  }

  public saveChunk(chunk: SemanticMemoryChunk): void {
    const chunks = this.getAllChunks();
    const existingIndex = chunks.findIndex((c) => c.id === chunk.id);
    if (existingIndex >= 0) {
      chunks[existingIndex] = chunk;
    } else {
      chunks.push(chunk);
    }

    if (!fs.existsSync(path.dirname(this.indexPath))) {
      fs.mkdirSync(path.dirname(this.indexPath), { recursive: true });
    }
    fs.writeFileSync(this.indexPath, JSON.stringify(chunks, null, 2), 'utf-8');

    // Also write markdown file for human readability and portable editing
    if (!fs.existsSync(this.knowledgeDir)) {
      fs.mkdirSync(this.knowledgeDir, { recursive: true });
    }
    const mdPath = path.join(this.knowledgeDir, `${chunk.id}.md`);
    const frontmatter = `---
id: ${chunk.id}
title: "${chunk.title.replace(/"/g, '\\"')}"
category: ${chunk.category}
tags: [${chunk.tags.map((t) => `"${t}"`).join(', ')}]
updatedAt: ${chunk.updatedAt}
---

`;
    fs.writeFileSync(mdPath, frontmatter + chunk.content, 'utf-8');
  }

  public getAllChunks(): SemanticMemoryChunk[] {
    if (!fs.existsSync(this.indexPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.indexPath, 'utf-8');
      return JSON.parse(data) as SemanticMemoryChunk[];
    } catch {
      return [];
    }
  }

  /**
   * Keyword and token-based lexical similarity for zero-dependency local retrieval.
   * If embeddings are present, can calculate cosine similarity.
   */
  public search(query: string, limit = 5): SearchResult[] {
    const chunks = this.getAllChunks();
    if (chunks.length === 0) return [];

    const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean);

    const scored: SearchResult[] = chunks.map((chunk) => {
      let score = 0;
      const titleLower = chunk.title.toLowerCase();
      const contentLower = chunk.content.toLowerCase();
      const tagLower = chunk.tags.map((t) => t.toLowerCase());

      for (const token of queryTokens) {
        if (titleLower.includes(token)) score += 3.0;
        if (tagLower.includes(token)) score += 2.0;
        if (contentLower.includes(token)) score += 1.0;
      }

      return { chunk, score };
    });

    return scored
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
