'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import InterviewQuestion from '@/components/InterviewQuestion';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

type Analysis = {
  question: string;
  response: string;
  grade: string;
  summary: string;
  pros: string[];
  cons: string[];
};

function generateClientRunId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function InterviewPage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsAudio, setQuestionsAudio] = useState<string[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const clientRunIdRef = useRef<string | null>(null);
  const pendingAnalysesRef = useRef<Map<number, Promise<Analysis | null>>>(new Map());

  useEffect(() => {
    const storedQuestions = sessionStorage.getItem('questions');
    const storedAudios = sessionStorage.getItem('questionsAudio');
    if (!storedQuestions) {
      router.push('/');
      return;
    }

    let crid = sessionStorage.getItem('clientRunId');
    if (!crid) {
      crid = generateClientRunId();
      sessionStorage.setItem('clientRunId', crid);
    }
    clientRunIdRef.current = crid;

    const parsedQuestions = JSON.parse(storedQuestions) as string[];
    setQuestions(parsedQuestions);

    if (storedAudios) {
      setQuestionsAudio(JSON.parse(storedAudios));
    } else {
      setQuestionsAudio(null);
    }

    const existingAnalysesRaw = sessionStorage.getItem('analyses');
    if (!existingAnalysesRaw) {
      const placeholder = new Array(parsedQuestions.length).fill(null);
      sessionStorage.setItem('analyses', JSON.stringify(placeholder));
    }

    setIsLoading(false);
  }, [router]);

  function readAnalysesFromStorage(): Array<Analysis | null> {
    try {
      const raw = sessionStorage.getItem('analyses');
      if (!raw) return [];
      return JSON.parse(raw) as Array<Analysis | null>;
    } catch {
      return [];
    }
  }
  function writeAnalysisToStorage(index: number, analysis: Analysis | null) {
    const arr = readAnalysesFromStorage();
    while (arr.length < questions.length) arr.push(null);
    arr[index] = analysis;
    sessionStorage.setItem('analyses', JSON.stringify(arr));
  }

  async function sendAnalysis(
    question: string,
    answer: string,
    index: number
  ): Promise<Analysis | null> {
    const payload = {
      question,
      response: answer,
      jobDescription: sessionStorage.getItem('jobDescription') ?? undefined,
      resume: sessionStorage.getItem('resume') ?? undefined,
      clientRunId: clientRunIdRef.current ?? undefined,
    };

    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastError: any = null;

    while (attempt <= MAX_RETRIES) {
      try {
        const resp = await fetch('/api/analyze-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await resp.json().catch(() => null);

        if (!resp.ok) {
          lastError = { status: resp.status, data };
          throw new Error(`API error ${resp.status}`);
        }

        const analysisCandidate = (data as any) ?? null;

        if (
          analysisCandidate &&
          typeof analysisCandidate.question === 'string' &&
          typeof analysisCandidate.response === 'string' &&
          typeof analysisCandidate.grade === 'string'
        ) {
          const analysis: Analysis = {
            question: String(analysisCandidate.question),
            response: String(analysisCandidate.response),
            grade: String(analysisCandidate.grade).slice(0, 1).toUpperCase(),
            summary: String(analysisCandidate.summary ?? ''),
            pros: Array.isArray(analysisCandidate.pros) ? analysisCandidate.pros.map(String) : [],
            cons: Array.isArray(analysisCandidate.cons) ? analysisCandidate.cons.map(String) : [],
          };
          writeAnalysisToStorage(index, analysis);
          return analysis;
        } else {
          lastError = { reason: 'bad_shape', data };
          throw new Error('Unexpected analysis shape');
        }
      } catch (err) {
        lastError = err;
        attempt++;
        await new Promise((res) => setTimeout(res, 200 * attempt));
      }
    }

    console.warn('sendAnalysis failed after retries for index', index, 'lastError', lastError);
    const fallback: Analysis = {
      question,
      response: answer,
      grade: 'C',
      summary: 'Analysis unavailable due to network/server issues.',
      pros: ['Answered the question'],
      cons: ['Automated analysis unavailable'],
    };
    writeAnalysisToStorage(index, fallback);
    return fallback;
  }

  const handleQuestionComplete = async (responseText: string) => {
    const questionIndex = currentQuestion;
    const questionText = questions[questionIndex];

    const newResponses = [...responses, responseText];
    setResponses(newResponses);
    sessionStorage.setItem('responses', JSON.stringify(newResponses));

    const analysisPromise = sendAnalysis(questionText, responseText, questionIndex);
    pendingAnalysesRef.current.set(questionIndex, analysisPromise);

    analysisPromise
      .catch((e) => {
        console.warn('analysis failed for index', questionIndex, e);
      })
      .finally(() => {
        pendingAnalysesRef.current.delete(questionIndex);
      });

    const isLast = questionIndex + 1 >= questions.length;

    if (!isLast) {
      setCurrentQuestion((s) => s + 1);
    } else {
      router.push('/results');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
    >
      <div className="max-w-4xl mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="mb-6 shadow-lg border border-indigo-100 mt-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-2.5">
                <motion.div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {questions.length > 0 && questionsAudio && (
          <InterviewQuestion
            question={questions[currentQuestion]}
            questionNumber={currentQuestion + 1}
            onComplete={handleQuestionComplete}
            audioSrc={questionsAudio ? questionsAudio[currentQuestion] : undefined}
          />
        )}
      </div>
    </motion.div>
  );
}
