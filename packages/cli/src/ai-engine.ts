import * as process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import type { RetrievedContext } from '@project-memory/core';

export interface AnswerResult {
  answer: string;
  model: string;
  provider: 'gemini' | 'groq' | 'local-direct';
  tokensUsed?: number;
}

export class AiEngine {
  private geminiClient: GoogleGenAI | null = null;
  private groqClient: Groq | null = null;

  constructor() {
    const geminiKey = process.env['GEMINI_API_KEY'];
    const groqKey = process.env['GROQ_API_KEY'];

    if (geminiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiKey });
    }
    if (groqKey) {
      this.groqClient = new Groq({ apiKey: groqKey });
    }
  }

  public getAvailableProvider(): 'gemini' | 'groq' | null {
    if (this.geminiClient) return 'gemini';
    if (this.groqClient) return 'groq';
    return null;
  }

  /**
   * Generates a grounded answer using the smallest sufficient context (ADR-008, INSTRUCTIONS §11)
   */
  public async answerQuestion(
    query: string,
    context: RetrievedContext
  ): Promise<AnswerResult> {
    // Fast path: If structured memory already provides a direct fact, return it with zero LLM tokens!
    if (context.directAnswer && !context.assembledSummary.includes('[Knowledge')) {
      return {
        answer: context.directAnswer,
        model: 'structured-memory-direct',
        provider: 'local-direct',
        tokensUsed: 0,
      };
    }

    const systemPrompt = `You are Project Memory, an intelligent technical assistant for a software project.
You answer questions for developers and AI agents grounded strictly in the project's source-derived memory.

Guidelines:
1. Ground your answers ONLY in the provided project context.
2. If evidence is insufficient, say: "I couldn't find enough project evidence to answer this reliably." Do NOT invent project details or speculate without clarifying.
3. Distinguish facts from inference.
4. Cite relevant files or sources if mentioned in the context.
5. Be concise, precise, and technically accurate.`;

    const userPrompt = `Project Memory Context:
${context.assembledSummary || '(No direct memory chunks found)'}

User Question: ${query}`;

    // 1. Try Gemini if available
    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`,
        });

        const text = response.text || 'No response generated.';
        return {
          answer: text.trim(),
          model: 'gemini-2.5-flash',
          provider: 'gemini',
        };
      } catch (err: any) {
        console.warn(`[AiEngine] Gemini request failed, attempting fallback: ${err?.message || err}`);
      }
    }

    // 2. Try Groq if available
    if (this.groqClient) {
      const groqModel =
        process.env['GROQ_MODEL'] || 'openai/gpt-oss-120b';

      try {
        const chatCompletion = await this.groqClient.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: groqModel,
        });

        const answer = chatCompletion.choices[0]?.message?.content || 'No response generated.';
        return {
          answer: answer.trim(),
          model: groqModel,
          provider: 'groq',
          tokensUsed: chatCompletion.usage?.total_tokens,
        };
      } catch (err: any) {
        // Try fallback to qwen/qwen3.8-27b if primary fails
        try {
          const fallbackCompletion = await this.groqClient.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            model: 'qwen/qwen3.8-27b',
          });
          const fallbackAnswer = fallbackCompletion.choices[0]?.message?.content || 'No response generated.';
          return {
            answer: fallbackAnswer.trim(),
            model: 'qwen/qwen3.8-27b',
            provider: 'groq',
            tokensUsed: fallbackCompletion.usage?.total_tokens,
          };
        } catch {
          console.warn(`[AiEngine] Groq request failed: ${err?.message || err}`);
        }
      }
    }

    // Fallback if neither API key is active or both failed: return the retrieved local context
    if (context.directAnswer) {
      return {
        answer: context.directAnswer,
        model: 'structured-memory-direct',
        provider: 'local-direct',
        tokensUsed: 0,
      };
    }

    return {
      answer: context.assembledSummary
        ? `[Offline Mode — Local Knowledge Retrieved]:\n\n${context.assembledSummary}\n\n(Tip: Set GEMINI_API_KEY or GROQ_API_KEY in .env for full AI synthesis)`
        : `I couldn't find enough project evidence to answer this reliably.`,
      model: 'local-fallback',
      provider: 'local-direct',
      tokensUsed: 0,
    };
  }
}
