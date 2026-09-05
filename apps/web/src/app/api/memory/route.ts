import { NextResponse } from 'next/server';
import path from 'node:path';
import {
  LocalStructuredMemoryStore,
  LocalSemanticMemoryStore,
  type StructuredMemoryState,
} from '@project-memory/core';

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), '../..');
    const structuredStore = new LocalStructuredMemoryStore({ projectRoot });
    const semanticStore = new LocalSemanticMemoryStore(projectRoot);

    const state = structuredStore.readState();
    const chunks = semanticStore.getAllChunks();

    return NextResponse.json({
      success: true,
      data: {
        state,
        knowledgeChunks: chunks,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load project memory' },
      { status: 500 }
    );
  }
}
