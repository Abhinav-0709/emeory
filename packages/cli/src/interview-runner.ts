import * as readline from 'node:readline';
import * as process from 'node:process';
import pc from 'picocolors';
import {
  QuestionGenerator,
  AnswerEvaluator,
  type InterviewQuestion,
} from '@project-memory/interview';

export class TerminalInterviewRunner {
  private projectRoot: string;
  private generator: QuestionGenerator;
  private evaluator: AnswerEvaluator;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.generator = new QuestionGenerator(projectRoot);
    this.evaluator = new AnswerEvaluator(projectRoot);
  }

  public async runSession(existingRl?: readline.Interface): Promise<void> {
    const questions = this.generator.generateQuestions();
    if (questions.length === 0) {
      console.log(pc.yellow('\nNo project memory found to generate interview questions. Run "project-memory analyze" first.\n'));
      return;
    }

    console.clear();
    console.log(pc.cyan('┌─────────────────────────────────────────────────────────────┐'));
    console.log(
      pc.cyan('│') +
        pc.bold(pc.white('  PROJECT MEMORY — TECHNICAL INTERVIEW SIMULATOR   ')) +
        pc.cyan('│')
    );
    console.log(pc.cyan('├─────────────────────────────────────────────────────────────┤'));
    console.log(
      pc.cyan('│') +
        pc.dim('  Test your ability to explain and defend your own codebase.   ') +
        pc.cyan('│')
    );
    console.log(pc.cyan('└─────────────────────────────────────────────────────────────┘'));
    console.log(
      pc.dim(`Prepared ${questions.length} questions across 5 difficulty levels (type "exit" to quit).\n`)
    );

    const isOwnRl = !existingRl;
    const rl =
      existingRl ??
      readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

    const askUser = (promptText: string): Promise<string> =>
      new Promise((resolve) => rl.question(promptText, resolve));

    let totalScore = 0;
    let questionsAnswered = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const diffColor =
        q.difficulty === 'basic'
          ? pc.green
          : q.difficulty === 'technical'
          ? pc.cyan
          : q.difficulty === 'architecture'
          ? pc.magenta
          : q.difficulty === 'failure_scenario'
          ? pc.yellow
          : pc.red;

      console.log(pc.bold(pc.white(`\n[Question ${i + 1}/${questions.length}] `)) + diffColor(`[${q.difficulty.toUpperCase()}]`));
      console.log(pc.bold(pc.cyan(q.question)));
      console.log(pc.dim('Expected Key Points: ' + q.expectedKeyPoints.join(' • ')));

      const answer = await askUser(pc.bold('\nYour Answer › '));
      if (!answer || answer.trim().toLowerCase() === 'exit') {
        console.log(pc.dim('\nEnding interview session early.\n'));
        break;
      }

      console.log(pc.dim('\n⠋ Evaluating your answer against project ground truth...'));
      const evaluation = await this.evaluator.evaluateAnswer(q, answer);

      // Render Evaluation Box
      const verdictColor =
        evaluation.verdict === 'Excellent'
          ? pc.green
          : evaluation.verdict === 'Good'
          ? pc.cyan
          : evaluation.verdict === 'Needs Improvement'
          ? pc.yellow
          : pc.red;

      console.log(pc.cyan('\n┌── Evaluation Result ────────────────────────────────────────┐'));
      console.log(`Verdict: ${verdictColor(pc.bold(evaluation.verdict))} (Score: ${pc.bold(`${evaluation.scores.overallScore}/10`)})`);
      console.log(
        pc.dim(
          `Accuracy: ${evaluation.scores.technicalAccuracy}/10 │ Depth: ${evaluation.scores.depth}/10 │ Architecture: ${evaluation.scores.architectureUnderstanding}/10`
        )
      );
      console.log(pc.cyan('├─────────────────────────────────────────────────────────────┤'));
      console.log(`Feedback: ${evaluation.feedback}`);

      if (evaluation.strengths.length > 0) {
        console.log(pc.green('\nStrengths:'));
        for (const s of evaluation.strengths) {
          console.log(`  ✔ ${s}`);
        }
      }

      if (evaluation.missingPoints.length > 0) {
        console.log(pc.yellow('\nMissing or Weak Points:'));
        for (const m of evaluation.missingPoints) {
          console.log(`  ⚠ ${m}`);
        }
      }

      if (evaluation.suggestedImprovement) {
        console.log(pc.magenta(`\nPro Tip: ${evaluation.suggestedImprovement}`));
      }
      console.log(pc.cyan('└─────────────────────────────────────────────────────────────┘\n'));

      totalScore += evaluation.scores.overallScore;
      questionsAnswered++;

      if (i < questions.length - 1) {
        const proceed = await askUser(pc.dim('Press Enter for next question (or "q" to stop)... '));
        if (proceed.trim().toLowerCase() === 'q') break;
      }
    }

    if (isOwnRl) {
      rl.close();
    }

    if (questionsAnswered > 0) {
      const avg = (totalScore / questionsAnswered).toFixed(1);
      console.log(pc.bold(pc.green(`\n=== Interview Session Completed ===`)));
      console.log(`Questions Answered: ${questionsAnswered}`);
      console.log(`Average Score: ${pc.bold(avg)} / 10\n`);
    }
  }
}
