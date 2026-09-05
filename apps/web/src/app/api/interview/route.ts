import { NextResponse } from 'next/server';
import path from 'node:path';
import { QuestionGenerator, AnswerEvaluator } from '@project-memory/interview';

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), '../..');
    const generator = new QuestionGenerator(projectRoot);
    const questions = generator.generateQuestions();

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json();
    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer required' }, { status: 400 });
    }

    const projectRoot = path.resolve(process.cwd(), '../..');
    const evaluator = new AnswerEvaluator(projectRoot);
    const evaluation = await evaluator.evaluateAnswer(question, answer);

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}
