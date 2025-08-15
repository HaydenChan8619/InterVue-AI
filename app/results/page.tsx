'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home, Download, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    const analyzeResponses = async () => {
      const questions = sessionStorage.getItem('questions');
      const responses = sessionStorage.getItem('responses');
      const jobDescription = sessionStorage.getItem('jobDescription');
      const resume = sessionStorage.getItem('resume');

      if (!questions || !responses || !jobDescription || !resume) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch('/api/analyze-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: JSON.parse(questions),
            responses: JSON.parse(responses),
            jobDescription,
            resume
          })
        });

        if (!response.ok) throw new Error('Failed to analyze responses');

        const data = await response.json();
        setResults(data.results);
        setOverallGrade(data.overallGrade);
      } catch (error) {
        console.error('Error analyzing responses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeResponses();
  }, [router]);

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
          <h1 className="text-4xl font-bold text-indigo-900 mb-3">Interview Results</h1>
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
                <span className="text-2xl font-bold text-indigo-900">Overall Grade</span>
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
                      <h2 className="text-xl font-bold text-indigo-900 mb-2">
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
                      <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
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