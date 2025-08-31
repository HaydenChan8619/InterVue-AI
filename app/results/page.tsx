'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home, Download, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface QuestionResult {
  question: string;
  response: string;
  grade: string;
  summary: string;
  pros: string[];
  cons: string[];
}

export default function ResultsPage() {
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [overallGrade, setOverallGrade] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.user_id ?? null;
  const [loadingDetail, setLoadingDetail] = useState<string>('Preparing analysis...');
  const analysisRef = useRef(false);

  const [perQuestionReady, setPerQuestionReady] = useState(false);
  const [aggregateReady, setAggregateReady] = useState(false);
  const [savedReady, setSavedReady] = useState(false);

  function safeRead<T = any>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`Failed to parse sessionStorage key ${key}:`, e);
      return null;
    }
  }

async function waitForAnalyses(timeoutMs = 60000, intervalMs = 400) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const analyses = safeRead<Array<QuestionResult | null>>('analyses') ?? [];
      const questions = safeRead<string[]>('questions') ?? [];

      if (questions.length > 0 && analyses.length >= questions.length && analyses.every((a) => a !== null)) {
      setPerQuestionReady(true);
        return analyses as QuestionResult[];
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return (safeRead<Array<QuestionResult | null>>('analyses') ?? []).map((a) => a ?? null);
  }

  async function callAggregateAnalysis() {
  try {
    const questions = safeRead<string[]>('questions') ?? [];
    const responses = safeRead<string[]>('responses') ?? [];

    const analyses = (await waitForAnalyses()) ?? [];
    console.log('analyses length', analyses.length);
    console.log('are all refs identical?', analyses.length > 0 && analyses.every(a => a === analyses[0]));
    console.log('analyses snapshot', analyses.map(a => ({ q: a?.question, r: a?.response })));

    const normalized: QuestionResult[] = (questions.length > 0 ? questions : analyses.map((_, i) => `Question ${i + 1}`))
      .map((q, i) => {
        const a = analyses[i] as QuestionResult | null | undefined;
        if (a) {
          return {
            question: String(a.question ?? q),
            response: String(a.response ?? (responses[i] ?? 'No response provided')),
            grade: String(a.grade ?? 'C').slice(0, 1).toUpperCase(),
            summary: String(a.summary ?? ''),
            pros: Array.isArray(a.pros) ? a.pros.map(String) : [],
            cons: Array.isArray(a.cons) ? a.cons.map(String) : [],
          } as QuestionResult;
        }

        return {
          question: q,
          response: responses[i] ?? 'No response provided',
          grade: 'C',
          summary: 'No analysis available',
          pros: [],
          cons: [],
        } as QuestionResult;
      });

    setResults(normalized);
    setPerQuestionReady(true);

    const overall = computeOverallFromResults(normalized);
    setOverallGrade(overall);

    setAggregateReady(true);
  } catch (e) {
    console.error('Error compiling per-question analyses:', e);

    const questions = safeRead<string[]>('questions') ?? [];
    const responses = safeRead<string[]>('responses') ?? [];
    const minimal = (questions || []).map((q, i) => ({
      question: q,
      response: responses[i] ?? 'No response provided',
      grade: 'C',
      summary: 'No analysis available',
      pros: [],
      cons: [],
    }));
    setResults(minimal);
    setOverallGrade(fallbackOverallGrade(minimal.map((m) => m.grade)));
    setPerQuestionReady(true);
    setAggregateReady(true);
  } finally {
    setIsLoading(false);
  }
}


  function computeOverallFromResults(items: QuestionResult[]) {
    const grades = items.map((i) => i.grade?.[0] ?? 'C');
    return fallbackOverallGrade(grades);
  }

  function fallbackOverallGrade(grades: string[]) {
    if (!grades || grades.length === 0) return 'C';
    const map = (g: string): number => {
      const s = (g ?? 'C').toUpperCase();
      switch (s[0]) {
        case 'A':
          return 4;
        case 'B':
          return 3;
        case 'C':
          return 2;
        case 'D':
          return 1;
        case 'F':
          return 0;
        default:
          return 2;
      }
    };
    const avg = grades.map(map).reduce((a, b) => a + b, 0) / grades.length;
    if (avg >= 3.5) return 'A';
    if (avg >= 2.5) return 'B';
    if (avg >= 1.5) return 'C';
    if (avg >= 0.5) return 'D';
    return 'F';
  }

useEffect(() => {
    if (analysisRef.current) return;
    analysisRef.current = true;

    const finalReport = safeRead<{ overallGrade: string; results: QuestionResult[] }>('finalReport');
    if (finalReport && Array.isArray(finalReport.results) && finalReport.results.length > 0) {
      setResults(finalReport.results);
      setOverallGrade(finalReport.overallGrade ?? computeOverallFromResults(finalReport.results));
      setPerQuestionReady(true);
      setAggregateReady(true);
      setSavedReady(true);
      setIsLoading(false);
      return;
    }

    callAggregateAnalysis();
  }, []);


useEffect(() => {
  if (!results?.length || !userId) return;
  if (sessionStorage.getItem('save_report')) return;

  (async () => {
    try {
      const runId = sessionStorage.getItem('analysis_run_id') ?? undefined;
      const saveBody = {
        userId,
        reportGrade: overallGrade,
        reportDetails: {
          results,
          jobDescription: sessionStorage.getItem('jobDescription'),
          resume: sessionStorage.getItem('resume'),
          clientRunId: runId,
          savedAt: new Date().toISOString(),
        },
      };

      const saveRes = await fetch('/api/save-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody),
      });

      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({ error: 'save failed' }));
        console.warn('Save report failed:', errJson);
      }

      sessionStorage.setItem('save_report','complete');
      setSavedReady(true);
    } catch (e) {
      console.warn('Save report error:', e);
    }
  })();
}, [results, overallGrade, userId]);

  const handleStartSession = () => 
  {
      router.push('/backgroundinfo');
  }

  const getGradeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case 'a': return 'bg-green-100 text-green-800 border-green-200';
      case 'b': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'c': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'd': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'f': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

    const StepCard: React.FC<{ title: string; ready: boolean; description?: string; delay?: number }> = ({ title, ready, description, delay = 0 }) => {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.35 }}
          className={`flex items-center gap-3 rounded-xl p-3 border ${ready ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-white'}`}
        >
          <div className={`w-3 h-3 rounded-full ${ready ? 'bg-green-500' : 'bg-slate-300'}`} />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-800">{title}</div>
            <div className="text-xs text-slate-500">{description}</div>
          </div>
        </motion.div>
      );
    };


   if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h2 className="text-2xl font-bold text-indigo-600">Analyzing responses</h2>
            <p className="text-sm text-slate-600 mt-2">We're running a few quick steps to produce your report.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
              <div>
                <div className="text-sm text-slate-700 font-medium">{loadingDetail}</div>
                <div className="text-xs text-slate-400">This should take around 15 seconds depending on your responses.</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <StepCard title="Per-question analyses" ready={perQuestionReady} description={perQuestionReady ? 'Complete' : 'Running...'} delay={0} />
              <StepCard title="Aggregate results" ready={aggregateReady} description={aggregateReady ? 'Complete' : 'Processing...'} delay={0.05} />
              <StepCard title="Save report" ready={savedReady} description={savedReady ? 'Saved' : 'Saving...'} delay={0.1} />
            </div>
          </motion.div>
        </div>
      </div>
    );
  } 

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">     
      <div className="max-w-6xl mx-auto pt-32 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "tween",
            ease: "easeOut",
            duration: 0.8 
          }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-indigo-600 mb-3">Interview Results</h1>
          <p className="text-xl text-slate-700">Here's how you performed in your practice interview</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "tween",
            ease: "easeOut",
            duration: 0.8,
            delay: 0.1
          }}
          className="mb-10"
        >
          <div className="bg-gradient-to-b from-white to-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-2xl font-bold text-indigo-600">Overall Grade</span>
              </div>
              <div className={`${getGradeColor(overallGrade)} text-5xl font-bold rounded-full px-8 py-4 inline-block`}>
                {overallGrade}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8 mb-10">
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                type: "tween",
                ease: "easeOut",
                duration: 0.8,
                delay: 0.2 + (index * 0.1)
              }}
            >
              <div className="bg-gradient-to-b from-white to-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-indigo-600 mb-2">
                        Question {index + 1}
                      </h2>
                      <p className="text-slate-700">
                        {result.question}
                      </p>
                    </div>
                    <div className={`${getGradeColor(result.grade)} text-xl font-bold rounded-full px-5 py-2 min-w-[70px] text-center`}>
                      {result.grade}
                    </div>
                  </div>
                  
                  <div className="space-y-6 pt-4 border-t border-indigo-100">
                    <div>
                      <h3 className="font-semibold text-indigo-600 mb-3 flex items-center gap-2">
                        <span className="bg-indigo-100 p-1 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Your Response Summary
                      </h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-slate-700">
                          {result.summary}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                        <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Strengths
                        </h3>
                        <ul className="space-y-2">
                          {result.pros.map((pro, proIndex) => (
                            <li key={proIndex} className="text-slate-700 flex items-start gap-2">
                              <div className="bg-green-100 p-1 rounded-full mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
                        <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                          <TrendingDown className="h-5 w-5 text-amber-600" />
                          Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                          {result.cons.map((con, conIndex) => (
                            <li key={conIndex} className="text-slate-700 flex items-start gap-2">
                              <div className="bg-amber-100 p-1 rounded-full mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "tween",
            ease: "easeOut",
            duration: 0.8,
            delay: 0.5
          }}
        >
          <div className="bg-gradient-to-b from-white to-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all"
                  onClick={handleStartSession}
                >
                  <Home className="h-5 w-5" />
                  <span>Practice Again</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}