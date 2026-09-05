import * as process from 'node:process';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import {
  LocalStructuredMemoryStore,
  type StructuredMemoryState,
} from '@project-memory/core';
import type { InterviewQuestion, AnswerEvaluation } from './types.js';

export class AnswerEvaluator {
  private projectRoot: string;
  private structuredStore: LocalStructuredMemoryStore;
  private geminiClient: GoogleGenAI | null = null;
  private groqClient: Groq | null = null;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.structuredStore = new LocalStructuredMemoryStore({ projectRoot });

    const geminiKey = process.env['GEMINI_API_KEY'];
    const groqKey = process.env['GROQ_API_KEY'];

    if (geminiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiKey });
    }
    if (groqKey) {
      this.groqClient = new Groq({ apiKey: groqKey });
    }
  }

  /**
   * Evaluates a candidate's answer against the actual project memory
   */
  public async evaluateAnswer(
    question: InterviewQuestion,
    userAnswer: string
  ): Promise<AnswerEvaluation> {
    const state = this.structuredStore.readState();
    const techStack = state?.techStack.map((t) => `${t.name} (${t.category})`).join(', ') || '';
    const components = state?.components.map((c) => `${c.name}: ${c.description}`).join('\n') || '';
    const decisions = state?.decisions.map((d) => `[${d.id}] ${d.title}: ${d.rationale}`).join('\n') || '';

    const systemPrompt = `You are a Senior Staff Software Engineer and Technical Interviewer assessing a candidate on a project they built.
Evaluate the candidate's answer based on the actual project facts.

Project Background Ground Truth:
- Tech Stack: ${techStack}
- Components: ${components}
- Recorded Decisions: ${decisions}

Question Asked:
"${question.question}"

Expected Key Points:
${question.expectedKeyPoints.map((p) => `- ${p}`).join('\n')}

Candidate Answer:
"${userAnswer}"

Your task:
Evaluate the answer rigorously. Assess:
1. Technical Accuracy (0-10)
2. Depth (0-10)
3. Architecture Understanding (0-10)
4. Overall Score (0-10)
5. Verdict: One of ["Excellent", "Good", "Needs Improvement", "Unsatisfactory"]
6. Strengths: List 1-3 bullet points of what they got right
7. Missing Points: List any important technical concepts or specifics they omitted
8. Feedback: 2-3 sentence candid feedback
9. Suggested Improvement: 1 concrete tip on how to defend this in a real interview

Respond in valid JSON format:
{
  "scores": {
    "technicalAccuracy": number,
    "depth": number,
    "architectureUnderstanding": number,
    "overallScore": number
  },
  "verdict": "Excellent" | "Good" | "Needs Improvement" | "Unsatisfactory",
  "feedback": "string",
  "missingPoints": ["string"],
  "strengths": ["string"],
  "suggestedImprovement": "string"
}`;

    // 1. Try Groq (Fastest)
    if (this.groqClient) {
      try {
        const groqModel = process.env['GROQ_MODEL'] || 'openai/gpt-oss-120b';
        const completion = await this.groqClient.chat.completions.create({
          messages: [{ role: 'user', content: systemPrompt }],
          model: groqModel,
          response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            questionId: question.id,
            ...parsed,
          };
        }
      } catch (err: any) {
        console.warn(`[AnswerEvaluator] Groq evaluation error: ${err?.message}`);
      }
    }

    // 2. Try Gemini
    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const raw = response.text;
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            questionId: question.id,
            ...parsed,
          };
        }
      } catch (err: any) {
        console.warn(`[AnswerEvaluator] Gemini evaluation error: ${err?.message}`);
      }
    }

    // 3. Heuristic offline evaluation if no LLM active
    const wordCount = userAnswer.trim().split(/\s+/).length;
    const score = Math.min(10, Math.max(2, Math.round(wordCount / 10)));
    return {
      questionId: question.id,
      scores: {
        technicalAccuracy: score,
        depth: score,
        architectureUnderstanding: score,
        overallScore: score,
      },
      verdict: score > 7 ? 'Good' : 'Needs Improvement',
      feedback: `Evaluated in local offline mode. Answer length: ${wordCount} words.`,
      missingPoints: ['Enable Groq or Gemini API for deep semantic rubric grading.'],
      strengths: ['Provided a direct response in terminal.'],
      suggestedImprovement: 'Set GROQ_API_KEY or GEMINI_API_KEY in .env for full AI-based interview critique.',
    };
  }
}
