'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home, Download, Star, TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview Results</h1>
          <p className="text-xl text-gray-600">Here's how you performed in your practice interview</p>
        </div>

        {/* Overall Grade */}
        <Card className="mb-8 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Star className="h-8 w-8 text-yellow-500" />
              <span className="text-2xl font-semibold">Overall Grade</span>
            </div>
            <Badge className={`text-4xl font-bold px-6 py-2 ${getGradeColor(overallGrade)}`}>
              {overallGrade}
            </Badge>
          </CardContent>
        </Card>

        {/* Individual Question Results */}
        <div className="space-y-6 mb-8">
          {results.map((result, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-2">
                      Question {index + 1}
                    </CardTitle>
                    <CardDescription className="text-base text-gray-700">
                      {result.question}
                    </CardDescription>
                  </div>
                  <Badge className={`ml-4 text-xl font-bold px-4 py-1 ${getGradeColor(result.grade)}`}>
                    {result.grade}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Your Response Summary:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {result.summary}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-800 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-1">
                        {result.pros.map((pro, proIndex) => (
                          <li key={proIndex} className="text-sm text-green-700 flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-1">
                        {result.cons.map((con, conIndex) => (
                          <li key={conIndex} className="text-sm text-orange-700 flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <Card className="bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Practice Again
              </Button>
              <Button
                onClick={() => window.print()}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Save Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}