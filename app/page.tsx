'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Briefcase, FileText, ArrowRight, Upload, X } from 'lucide-react';

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeFile(file);

    // Extract text from file
    try {
      let text = '';
      if (file.type === 'text/plain') {
        text = await file.text();
      } else if (file.type === 'application/pdf') {
        // For PDF files, we'll need to handle this on the server side
        // For now, we'll ask the user to copy-paste or use a text file
        text = `PDF file uploaded: ${file.name}. Please ensure your resume content is clearly readable.`;
      } else {
        text = await file.text();
      }
      setResumeText(text);
    } catch (error) {
      console.error('Error reading file:', error);
      setResumeText(`File uploaded: ${file.name}`);
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    setResumeText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStart = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Store the job description and resume in sessionStorage for the interview flow
      sessionStorage.setItem('jobDescription', jobDescription);
      sessionStorage.setItem('resume', resumeText);
      
      // Generate questions based on job description and resume
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resume: resumeText })
      });
      
      if (!response.ok) throw new Error('Failed to generate questions');
      
      const { questions } = await response.json();
      sessionStorage.setItem('questions', JSON.stringify(questions));
      
      router.push('/interview');
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = jobDescription.trim() && resumeText.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Interview Prepper</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Practice your interview skills with AI-powered questions tailored to your job application
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-6 mb-8">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Your Resume
              </CardTitle>
              <CardDescription>
                Upload your resume or key qualifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Click to upload your resume
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports .txt, .pdf, .doc, .docx files
                    </p>
                  </label>
                </div>
                
                {resumeFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {resumeFile.name}
                        </span>
                        <span className="text-xs text-green-600">
                          ({Math.round(resumeFile.size / 1024)} KB)
                        </span>
                      </div>
                      <Button
                        onClick={removeFile}
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {resumeText && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Resume Preview:
                    </Label>
                    <div className="bg-gray-50 border rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {resumeText.length > 200 
                          ? `${resumeText.substring(0, 200)}...` 
                          : resumeText
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste the job description you're applying for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to begin?</h3>
              <p className="text-gray-600 mb-6">
                You'll be asked 5 questions based on the job description and your background. 
                Each question will be recorded using your microphone.
              </p>
              <Button
                onClick={handleStart}
                disabled={!isFormValid || isLoading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                {isLoading ? (
                  "Generating Questions..."
                ) : (
                  <>
                    Start Interview Practice
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}