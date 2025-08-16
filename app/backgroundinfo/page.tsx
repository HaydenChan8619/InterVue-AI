'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, FileText, ArrowRight, Upload, X } from 'lucide-react';
import { extractPdfText } from '@/lib/extractPdfText';
import { motion } from 'framer-motion';

export default function BackgroundInfoPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await extractPdfText(file);
      setResumeText(text);
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

  return(
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto pt-16 pb-12">
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
          <p className="text-xl text-slate-700 max-w-2xl mx-auto pt-8 text-indigo-600">
            To get started, <a className='font-bold text-indigo-600'>upload your resume and job description</a>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-1 gap-8 mb-10">
          {/* Resume Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "tween",
              ease: "easeOut",
              duration: 0.8,
              delay: 0.1
            }}
          >
            <div className="bg-gradient-to-b from-white to-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-indigo-600">Your Resume</h2>
                </div>
                <p className="text-slate-600 mb-6">
                  Upload your resume or key qualifications
                </p>
                
                <div className="space-y-6">
                  <div 
                    className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors cursor-pointer bg-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-indigo-100 p-3 rounded-full mb-4">
                        <Upload className="h-6 w-6 text-indigo-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Click to upload your resume
                      </p>
                      <p className="text-xs text-slate-500">
                        Supports .pdf files
                      </p>
                    </div>
                  </div>
                  
                  {resumeFile && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <FileText className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              {resumeFile.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {Math.round(resumeFile.size / 1024)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={removeFile}
                          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                  
                  {resumeText && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4"
                    >
                      <h3 className="text-sm font-medium text-green-600">
                        Resume Uploaded!
                      </h3>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Job Description Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "tween",
              ease: "easeOut",
              duration: 0.8,
              delay: 0.2
            }}
          >
            <div className="bg-gradient-to-b from-white to-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-indigo-600">Job Description</h2>
                </div>
                <p className="text-slate-600 mb-4">
                  Paste the job description you're applying for
                </p>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full min-h-[200px] p-4 text-slate-700 bg-white resize-none focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Start Button Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "tween",
            ease: "easeOut",
            duration: 0.8,
            delay: 0.3
          }}
        >
          <div className="bg-gradient-to-br from-white to-white rounded-2xl shadow-lg border border-indigo-100 backdrop-blur-sm">
            <div className="p-8">
              <div className="text-center">
                <h3 className="text-xl font-bold text-indigo-600 mb-3">Ready to begin?</h3>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  You'll be asked 5 questions based on the job description and your background.
                </p> 
                  
                  <p className='text-slate-600 mb-6 max-w-2xl mx-auto'>Each question will be recorded using your microphone.</p>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStart}
                  disabled={!isFormValid || isLoading}
                  className={`px-8 py-4 rounded-xl font-medium text-lg transition-all ${
                    !isFormValid || isLoading 
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>Generating Questions...</span>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white border-opacity-50"></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Start Interview Practice</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}