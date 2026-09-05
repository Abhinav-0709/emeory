import {
  LocalStructuredMemoryStore,
  LocalSemanticMemoryStore,
  type StructuredMemoryState,
} from '@project-memory/core';
import type { InterviewQuestion, InterviewDifficulty } from './types.js';

export class QuestionGenerator {
  private projectRoot: string;
  private structuredStore: LocalStructuredMemoryStore;
  private semanticStore: LocalSemanticMemoryStore;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.structuredStore = new LocalStructuredMemoryStore({ projectRoot });
    this.semanticStore = new LocalSemanticMemoryStore(projectRoot);
  }

  /**
   * Generates a calibrated set of interview questions strictly grounded in the project memory
   */
  public generateQuestions(): InterviewQuestion[] {
    const state = this.structuredStore.readState();
    const questions: InterviewQuestion[] = [];

    const projectName = state?.identity.name ?? 'This Project';
    const techStack = state?.techStack ?? [];
    const components = state?.components ?? [];
    const decisions = state?.decisions ?? [];

    // 1. Basic level: Project identity & purpose
    questions.push({
      id: 'q-basic-1',
      difficulty: 'basic',
      question: `Can you introduce ${projectName}, the core problem it solves, and how you designed its fundamental workflow?`,
      expectedKeyPoints: [
        'Clear problem statement',
        'Who the target users are',
        'High-level workflow and how data moves',
      ],
    });

    // 2. Technical level: Stack selection & trade-offs
    if (techStack.length > 0) {
      const primaryTech = techStack.find((t) => t.category === 'framework' || t.category === 'language') ?? techStack[0];
      questions.push({
        id: 'q-tech-1',
        difficulty: 'technical',
        question: `Why did you choose ${primaryTech?.name} (${primaryTech?.category}) for this project? What trade-offs or alternatives did you evaluate?`,
        expectedKeyPoints: [
          `Specific technical rationale for choosing ${primaryTech?.name}`,
          'Ecosystem advantages and trade-offs considered',
          'How it integrates with the rest of the application',
        ],
      });
    }

    // 3. Architecture level: Component communication & boundaries
    if (components.length > 0) {
      const compNames = components.map((c) => c.name).slice(0, 3).join(', ');
      questions.push({
        id: 'q-arch-1',
        difficulty: 'architecture',
        question: `Walk me through the architecture of your system, specifically how modules like ${compNames} interact and maintain separation of concerns.`,
        expectedKeyPoints: [
          'Module boundaries and dependency direction',
          'How requests or data pass between components',
          'Why the boundaries are separated this way',
        ],
        referencedComponents: components.map((c) => c.name),
      });
    }

    // 4. Technical decisions (ADRs) if present
    if (decisions.length > 0) {
      const d = decisions[0]!;
      questions.push({
        id: `q-dec-${d.id.toLowerCase()}`,
        difficulty: 'technical',
        question: `In decision record ${d.id}, you decided to "${d.title}". What was the underlying problem, and why was this solution preferred?`,
        expectedKeyPoints: [
          `Context: ${d.context}`,
          `Rationale: ${d.rationale}`,
          'Operational or development consequences',
        ],
        referencedDecisions: [d.id],
      });
    }

    // 5. Failure scenario level: What breaks when things fail?
    questions.push({
      id: 'q-fail-1',
      difficulty: 'failure_scenario',
      question: `What happens if one of your core dependencies or services becomes unavailable or crashes during execution? Where are the single points of failure, and how does your system handle recovery?`,
      expectedKeyPoints: [
        'Identification of points of failure',
        'Error handling and fallback behavior',
        'Data consistency and recovery strategy',
      ],
    });

    // 6. Scaling level: Bottlenecks at high volume
    questions.push({
      id: 'q-scale-1',
      difficulty: 'scaling',
      question: `If this project experienced a 100x increase in concurrent users or data volume tomorrow, where would the first bottleneck appear, and how would you redesign it?`,
      expectedKeyPoints: [
        'Identification of current bottleneck (I/O, database, CPU, memory)',
        'Concrete scaling strategy (caching, partitioning, worker distribution)',
        'Monitoring and latency considerations',
      ],
    });

    return questions;
  }
}
