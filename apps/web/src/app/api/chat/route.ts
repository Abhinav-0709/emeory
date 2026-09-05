import { NextResponse } from 'next/server';
import path from 'node:path';
import { MemoryRetriever } from '@project-memory/core';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const projectRoot = path.resolve(process.cwd(), '../..');
    const retriever = new MemoryRetriever(projectRoot);
    const context = retriever.retrieve(query);

    let answer = context.directAnswer || '';
    let provider = 'structured-direct';
    let model = 'local';

    const groqKey = process.env['GROQ_API_KEY'];
    const geminiKey = process.env['GEMINI_API_KEY'];

    const systemPrompt = `You are Project Memory, an intelligent technical assistant for a software project.
Answer questions grounded strictly in the project's source-derived memory.

Guidelines:
1. Ground your answer in the provided context.
2. If evidence is missing, state clearly: "I couldn't find enough project evidence to answer this reliably."
3. Cite relevant files or components.
4. Format with clean markdown.`;

    const userPrompt = `Project Memory Context:
${context.assembledSummary || '(No direct memory chunks found)'}

User Question: ${query}`;

    // Try Groq first
    if (groqKey && !context.directAnswer) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const groqModel = process.env['GROQ_MODEL'] || 'openai/gpt-oss-120b';
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: groqModel,
        });
        answer = completion.choices[0]?.message?.content || answer;
        provider = 'groq';
        model = groqModel;
      } catch (err) {
        console.warn('Groq failed, trying fallback', err);
      }
    }

    // Try Gemini if Groq not available
    if (!answer && geminiKey) {
      try {
        const gemini = new GoogleGenAI({ apiKey: geminiKey });
        const resp = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`,
        });
        answer = resp.text || '';
        provider = 'gemini';
        model = 'gemini-2.5-flash';
      } catch (err) {
        console.warn('Gemini failed', err);
      }
    }

    // Offline fallback
    if (!answer) {
      answer = context.assembledSummary
        ? `[Offline Grounded Response]:\n\n${context.assembledSummary}`
        : "I couldn't find enough project evidence to answer this reliably.";
    }

    return NextResponse.json({
      success: true,
      data: {
        query,
        answer,
        provider,
        model,
        intent: context.intent,
        structuredFacts: context.structuredFacts,
        semanticChunks: context.semanticChunks,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Chat failed' },
      { status: 500 }
    );
  }
}
