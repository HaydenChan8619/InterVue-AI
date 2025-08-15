'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InterviewQuestion from '@/components/InterviewQuestion';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

export default function InterviewPage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedQuestions = sessionStorage.getItem('questions');
    if (!storedQuestions) {
      router.push('/');
      return;
    }
    
    const parsedQuestions = JSON.parse(storedQuestions);
    setQuestions(parsedQuestions);
    setIsLoading(false);
  }, [router]);

  const handleQuestionComplete = (response: string) => {
    const newResponses = [...responses, response];
    setResponses(newResponses);
    
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Store responses and redirect to results
      sessionStorage.setItem('responses', JSON.stringify(newResponses));
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

  const progress = ((currentQuestion + 1) / questions.length) * 100;

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
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                ></motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {questions.length > 0 && (
          <InterviewQuestion
            question={questions[currentQuestion]}
            questionNumber={currentQuestion + 1}
            onComplete={handleQuestionComplete}
          />
        )}
      </div>
    </motion.div>
  );
}