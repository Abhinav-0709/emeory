'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Cpu,
  Brain,
  MessageSquare,
  Award,
  Terminal,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Send,
  Sparkles,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface ProjectState {
  identity: {
    name: string;
    version: string;
    description: string;
    rootPath: string;
    updatedAt: string;
  };
  techStack: Array<{
    name: string;
    category: string;
    confidence: number;
    source: { reference: string };
  }>;
  components: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    sources: Array<{ reference: string }>;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    status: string;
    context: string;
    decision: string;
    rationale: string;
  }>;
}

interface KnowledgeChunk {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'decisions' | 'chat' | 'interview'>('overview');
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<{
    state: ProjectState | null;
    knowledgeChunks: KnowledgeChunk[];
  }>({ state: null, knowledgeChunks: [] });

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; model?: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am Project Memory. Ask me anything about the architecture, technology choices, or file structure of this codebase.',
      model: 'system',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Interview State
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const fetchMemory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/memory');
      const json = await res.json();
      if (json.success) {
        setProjectData(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewQuestions = async () => {
    try {
      const res = await fetch('/api/interview');
      const json = await res.json();
      if (json.success) {
        setInterviewQuestions(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemory();
    fetchInterviewQuestions();
  }, []);

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const q = chatInput;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.data.answer,
            model: `${data.data.provider} (${data.data.model})`,
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an error retrieving that answer.',
          model: 'error',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!userAnswer.trim() || evaluating) return;
    const currentQ = interviewQuestions[currentQIndex];
    if (!currentQ) return;

    setEvaluating(true);
    setEvaluation(null);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ, answer: userAnswer }),
      });
      const data = await res.json();
      if (data.success) {
        setEvaluation(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  const state = projectData.state;

  return (
    <div className="flex h-screen w-full bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#0d1322] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">Emeory</h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v0.1.0
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="h-4 w-4" />
              Project Overview
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Cpu className="h-4 w-4" />
              Architecture View
            </button>

            <button
              onClick={() => setActiveTab('decisions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'decisions'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <FileText className="h-4 w-4" />
              Decisions (ADRs)
              {state?.decisions.length ? (
                <span className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  {state.decisions.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Project AI Chat
            </button>

            <button
              onClick={() => setActiveTab('interview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'interview'
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Award className="h-4 w-4 text-indigo-400" />
              Interview Simulator
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/60 text-[11px] text-slate-500 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Local-First Memory Active</span>
          </div>
          <div className="font-mono text-[10px] truncate text-slate-500">
            {state?.identity.rootPath || 'memory-project'}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#090d16]">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#0d1322]/50 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm text-slate-200">
              {state?.identity.name || 'Loading Project...'}
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
              v{state?.identity.version || '0.1.0'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMemory}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors bg-slate-800/40 px-3 py-1.5 rounded-md border border-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Memory
            </button>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              MCP Ready
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Hero Banner */}
              <div className="relative rounded-2xl p-6 bg-gradient-to-r from-[#0f172a] via-[#131d33] to-[#0f172a] border border-slate-800/80 shadow-xl overflow-hidden">
                <div className="relative z-10 space-y-2">
                  <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">
                    Project Intelligence Layer
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    {state?.identity.name || 'Project Memory'}
                  </h3>
                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    {state?.identity.description ||
                      'Portable, persistent project-context layer for software projects and AI coding agents.'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Tech Facts</span>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    {state?.techStack.length || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Components</span>
                  <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                    {state?.components.length || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Recorded ADRs</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {state?.decisions.length || 0}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Knowledge Chunks</span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    {projectData.knowledgeChunks.length || 0}
                  </div>
                </div>
              </div>

              {/* Detected Tech Stack Card */}
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  Deterministic Tech Stack (Source of Truth)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {state?.techStack.map((tech, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-slate-100">{tech.name}</span>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          {tech.category}
                        </span>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 truncate">
                        via {tech.source.reference}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic Knowledge Entries */}
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Semantic Knowledge Base (.project-memory/knowledge)
                </h4>
                <div className="space-y-3">
                  {projectData.knowledgeChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="p-4 rounded-lg bg-slate-800/30 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-indigo-300">{chunk.title}</span>
                        <div className="flex gap-1.5">
                          {chunk.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[9px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-mono line-clamp-3">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ARCHITECTURE TAB */}
          {activeTab === 'architecture' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white">System Architecture & Component Map</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Modules, boundaries, and internal dependencies discovered in the repository.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {state?.components.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 hover:border-cyan-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-cyan-300">{comp.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {comp.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{comp.description}</p>
                      <div className="pt-2 border-t border-slate-700/40 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                        <span>Source:</span>
                        {comp.sources.map((s, i) => (
                          <span key={i} className="text-cyan-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {s.reference}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DECISIONS (ADR) TAB */}
          {activeTab === 'decisions' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Architecture Decision Records (ADRs)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Technical decisions preserved according to ADR-001 through ADR-025.
                </p>
              </div>

              <div className="space-y-4">
                {state?.decisions && state.decisions.length > 0 ? (
                  state.decisions.map((dec) => (
                    <div
                      key={dec.id}
                      className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {dec.id}
                          </span>
                          <h4 className="font-semibold text-sm text-white">{dec.title}</h4>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {dec.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-300">
                        <div>
                          <strong className="text-slate-400">Context:</strong> {dec.context}
                        </div>
                        <div>
                          <strong className="text-slate-400">Decision:</strong> {dec.decision}
                        </div>
                        <div>
                          <strong className="text-slate-400">Rationale:</strong> {dec.rationale}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center rounded-xl bg-slate-900/30 border border-slate-800 text-xs text-slate-500">
                    No custom decisions recorded yet. Agents can record decisions using the MCP tool{' '}
                    <code className="text-cyan-400">record_technical_decision</code>.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto h-full flex flex-col">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed space-y-1 ${
                        msg.role === 'user'
                          ? 'bg-cyan-600 text-white rounded-br-none shadow-md shadow-cyan-600/20'
                          : 'bg-slate-900/80 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                    {msg.model && msg.role === 'assistant' && (
                      <span className="text-[10px] font-mono text-slate-500 mt-1 px-1">
                        {msg.model}
                      </span>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 p-2">
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Retrieving grounded context & synthesizing...
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendChat} className="mt-4 relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything about the architecture, tech choices, or modules..."
                  className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 pr-12 transition-colors"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="absolute right-2.5 top-2.5 h-7 w-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 flex items-center justify-center text-slate-950 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* INTERVIEW SIMULATOR TAB */}
          {activeTab === 'interview' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {interviewQuestions.length > 0 ? (
                <>
                  {/* Question Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111827] to-[#0f172a] border border-indigo-500/30 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                        Question {currentQIndex + 1} of {interviewQuestions.length} —{' '}
                        {interviewQuestions[currentQIndex]?.difficulty?.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">Technical Drill</span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug">
                      {interviewQuestions[currentQIndex]?.question}
                    </h3>

                    <div className="text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
                      <strong className="text-slate-300">Expected Key Concepts:</strong>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {interviewQuestions[currentQIndex]?.expectedKeyPoints?.map(
                          (kp: string, kIdx: number) => (
                            <li key={kIdx}>{kp}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Candidate Answer Box */}
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Explain your answer as you would to a Principal Engineer in an interview..."
                      className="w-full bg-[#0d1322] border border-slate-700/80 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {interviewQuestions.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentQIndex(idx);
                              setEvaluation(null);
                              setUserAnswer('');
                            }}
                            className={`h-7 w-7 rounded-lg text-xs font-mono font-medium transition-all ${
                              currentQIndex === idx
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleEvaluateAnswer}
                        disabled={evaluating || !userAnswer.trim()}
                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-medium text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                      >
                        {evaluating ? (
                          <>
                            <Sparkles className="h-4 w-4 animate-spin" />
                            Scoring Answer...
                          </>
                        ) : (
                          <>
                            <Award className="h-4 w-4" />
                            Submit & Evaluate
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Evaluation Result */}
                  {evaluation && (
                    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <span className="text-xs text-slate-400">Verdict</span>
                          <div
                            className={`text-lg font-bold ${
                              evaluation.verdict === 'Excellent'
                                ? 'text-emerald-400'
                                : evaluation.verdict === 'Good'
                                ? 'text-cyan-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {evaluation.verdict}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400">Overall Score</span>
                          <div className="text-2xl font-mono font-bold text-white">
                            {evaluation.scores?.overallScore}/10
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{evaluation.feedback}"
                      </p>

                      {evaluation.strengths?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-emerald-400">
                            Strengths:
                          </span>
                          {evaluation.strengths.map((s: string, idx: number) => (
                            <div
                              key={idx}
                              className="text-xs text-slate-300 flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {evaluation.missingPoints?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-amber-400">
                            Missing Concepts:
                          </span>
                          {evaluation.missingPoints.map((m: string, idx: number) => (
                            <div
                              key={idx}
                              className="text-xs text-slate-300 flex items-center gap-2"
                            >
                              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {evaluation.suggestedImprovement && (
                        <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/60 text-xs text-indigo-300">
                          <strong>Pro Tip:</strong> {evaluation.suggestedImprovement}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Loading project interview questions...
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
