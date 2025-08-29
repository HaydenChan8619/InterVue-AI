'use client';

import { useState, useEffect } from 'react';
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

 /* useEffect(() => {
  const ANALYSIS_IN_PROGRESS = 'analysis_in_progress';
  const ANALYSIS_DONE = 'analysis_done';
  const ANALYSIS_RESULT = 'analysis_result';

  let pollTimer: number | null = null;

  const loadCachedResult = () => {
    const raw = sessionStorage.getItem(ANALYSIS_RESULT);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const waitForDone = (checkInterval = 300, timeout = 15000) =>
    new Promise<{ results: QuestionResult[]; overallGrade: string } | null>((resolve) => {
      const start = Date.now();
      const tick = () => {
        const done = sessionStorage.getItem(ANALYSIS_DONE);
        if (done) {
          const cached = loadCachedResult();
          resolve(cached);
          return;
        }
        if (Date.now() - start > timeout) {
          resolve(null); // timed out waiting
          return;
        }
        pollTimer = window.setTimeout(tick, checkInterval) as unknown as number;
      };
      tick();
    });

  const analyzeResponses = async () => {
    try {
      const questions = sessionStorage.getItem('questions');
      const responses = sessionStorage.getItem('responses');
      const jobDescription = sessionStorage.getItem('jobDescription');
      const resume = sessionStorage.getItem('resume');

      if (!questions || !responses || !jobDescription || !resume) {
        router.push('/');
        return;
      }

      // If we already have final result cached, use it and skip network
      const cachedFinal = loadCachedResult();
      if (cachedFinal) {
        setResults(cachedFinal.results);
        setOverallGrade(cachedFinal.overallGrade);
        setIsLoading(false);
        return;
      }

      // If another tab/mount has an analysis in progress, wait for it
      const inProgress = sessionStorage.getItem(ANALYSIS_IN_PROGRESS);
      if (inProgress) {
        const waited = await waitForDone();
        if (waited) {
          setResults(waited.results);
          setOverallGrade(waited.overallGrade);
          setIsLoading(false);
          return;
        }
        // if wait timed out, fall through and start a new analysis
      }

      // Start a new analysis run (create a runId)
      const runId = crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
      sessionStorage.setItem(ANALYSIS_IN_PROGRESS, runId);

      const response = await fetch('/api/analyze-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: JSON.parse(questions),
          responses: JSON.parse(responses),
          jobDescription,
          resume,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze responses');

      const data = await response.json();

      // Save to state
      setResults(data.results);
      setOverallGrade(data.overallGrade);

      // Persist final analysis to sessionStorage so future mounts can reuse it
      try {
        const payload = { results: data.results, overallGrade: data.overallGrade };
        sessionStorage.setItem(ANALYSIS_RESULT, JSON.stringify(payload));
        sessionStorage.setItem(ANALYSIS_DONE, runId);
      } catch (err) {
        console.warn('Failed to write analysis cache to sessionStorage', err);
      } finally {
        sessionStorage.removeItem(ANALYSIS_IN_PROGRESS);
      }

      // Save report to DB (only once per run)
      try {
        // use the jobDescription & resume from sessionStorage (strings)
        const jobDescriptionStr = jobDescription;
        const resumeStr = resume;
        // include the client run id so server can detect duplicates later if you want
        const saveBody = {
          userId,
          reportGrade: data.overallGrade,
          reportDetails: {
            results: data.results,
            jobDescription: jobDescriptionStr,
            resume: resumeStr,
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
        } else {
          // optional success handling
          // const saved = await saveRes.json();
          // console.log('Report saved', saved);
        }
      } catch (saveErr) {
        console.warn('Save report error:', saveErr);
      }
    } catch (error) {
      console.error('Error analyzing responses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  analyzeResponses();

  return () => {
    if (pollTimer) {
      clearTimeout(pollTimer);
    }
  };
}, [router, userId]);*/

// inside your component (replace your useEffect block with this)
useEffect(() => {
  const ANALYSIS_IN_PROGRESS = 'analysis_in_progress';
  const ANALYSIS_DONE = 'analysis_done';
  const ANALYSIS_RESULT = 'analysis_result';

  let pollTimer: number | null = null;

  const loadCachedResult = () => {
    const raw = sessionStorage.getItem(ANALYSIS_RESULT);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  const waitForDone = (checkInterval = 300, timeout = 15000) =>
    new Promise<{ results: QuestionResult[]; overallGrade: string } | null>((resolve) => {
      const start = Date.now();
      const tick = () => {
        const done = sessionStorage.getItem(ANALYSIS_DONE);
        if (done) {
          const cached = loadCachedResult();
          resolve(cached);
          return;
        }
        if (Date.now() - start > timeout) {
          resolve(null);
          return;
        }
        pollTimer = window.setTimeout(tick, checkInterval) as unknown as number;
      };
      tick();
    });

  // single function that ensures same-tab dedupe via a global promise
  const analyzeOnce = async () => {
    // if another code path in this window already created the promise, reuse it
    const globalKey = '__analysisPromise';
    if ((window as any)[globalKey]) {
      return (window as any)[globalKey];
    }

    // Create a promise and attach to window so other mounts reuse it
    const promise = (async () => {
      try {
        const questions = sessionStorage.getItem('questions');
        const responses = sessionStorage.getItem('responses');
        const jobDescription = sessionStorage.getItem('jobDescription');
        const resume = sessionStorage.getItem('resume');

        if (!questions || !responses || !jobDescription || !resume) {
          // redirect or bail
          router.push('/');
          return null;
        }

        // cached final result?
        const cachedFinal = loadCachedResult();
        if (cachedFinal) {
          return cachedFinal;
        }

        // If another TAB has an analysis in progress, wait for it (cross-tab)
        const inProgress = sessionStorage.getItem(ANALYSIS_IN_PROGRESS);
        if (inProgress) {
          const waited = await waitForDone();
          if (waited) return waited;
          // else timed out -> we'll attempt a new analysis
        }

        // Start new run
        const runId = crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
        sessionStorage.setItem(ANALYSIS_IN_PROGRESS, runId);

        // IMPORTANT: include runId in POST so the server can be idempotent if you implement that.
        const response = await fetch('/api/analyze-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: JSON.parse(questions),
            responses: JSON.parse(responses),
            jobDescription,
            resume,
            clientRunId: runId, // pass runId for server-side dedupe/caching
          }),
        });

        if (!response.ok) throw new Error('Failed to analyze responses');

        const data = await response.json();

        // persist to sessionStorage (so other mounts/tabs use it)
        try {
          const payload = { results: data.results, overallGrade: data.overallGrade };
          sessionStorage.setItem(ANALYSIS_RESULT, JSON.stringify(payload));
          sessionStorage.setItem(ANALYSIS_DONE, runId);
        } catch (err) {
          console.warn('Failed to write analysis cache to sessionStorage', err);
        } finally {
          sessionStorage.removeItem(ANALYSIS_IN_PROGRESS);
        }

        return { results: data.results, overallGrade: data.overallGrade };
      } catch (err) {
        // make sure errors propagate but also clean global state
        throw err;
      } finally {
        // leave the promise in place while results are available to reuse;
        // optionally delete it here to allow new runs later:
        // delete (window as any)[globalKey];
      }
    })();

    (window as any)[globalKey] = promise;
    return promise;
  };

  // run it and set state
  (async () => {
    try {
      setIsLoading(true);

      // First check cached result quickly
      const cached = loadCachedResult();
      if (cached) {
        setResults(cached.results);
        setOverallGrade(cached.overallGrade);
        setIsLoading(false);
        return;
      }

      // Attempt to reuse result across same-tab mounts and across tabs
      const data = await analyzeOnce();

      if (!data) {
        // If analyzeOnce returned null (e.g. redirect), bail.
        return;
      }

      setResults(data.results);
      setOverallGrade(data.overallGrade);
    } catch (error) {
      console.error('Error analyzing responses:', error);
    } finally {
      setIsLoading(false);
    }
  })();

  return () => {
    if (pollTimer) clearTimeout(pollTimer);
  };
  // NOTE: keep deps minimal so this runs only once per mount lifecycle.
  // remove userId from deps to avoid re-running when session resolves.
}, [router]);


useEffect(() => {
  if (!results?.length || !userId) return;

  (async () => {
    try {
      const runId = sessionStorage.getItem('analysis_run_id') ?? undefined; // optional
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
    } catch (e) {
      console.warn('Save report error:', e);
    }
  })();
}, [results, overallGrade, userId]);

  const handleStartSession = () => 
  {
      // Eventually need to implement a google auth check here
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your interview performance...</p>
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

        {/* Overall Grade */}
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

        {/* Individual Question Results */}
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

        {/* Actions */}
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
                  className="flex items-center justify-center gap-2 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-medium py-3 px-6 rounded-xl transition-all"
                  onClick={handleStartSession}
                >
                  <Home className="h-5 w-5" />
                  <span>Practice Again</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all"
                  onClick={() => window.print()}
                >
                  <Download className="h-5 w-5" />
                  <span>Save Results</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}