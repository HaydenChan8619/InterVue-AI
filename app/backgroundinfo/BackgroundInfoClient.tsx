'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, FileText, ArrowRight, Upload, X } from 'lucide-react';
import { extractPdfText } from '@/lib/extractPdfText';
import { motion } from 'framer-motion';
import LoginModal from '@/components/LoginModal';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import CreditPopup from '@/components/CreditPopup';
import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';

export default function BackgroundInfoClient() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  const searchParams = useSearchParams(); 
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('info');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [savedFileName, setSavedFileName] = useState('');
  
  const didFetchRef = useRef(false);  
  const didHandleStripeRef = useRef(false);

  useEffect(() => {
    if (status !== 'loading') {
      setOpen(!session);
    }
  }, [status, session]);

  useEffect(() => {
    if (didFetchRef.current) return;              
    if (status !== 'authenticated') return;      
    if (!session?.user?.user_id) return;          

    didFetchRef.current = true; 

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('job_last_used, resume_last_used, resume_file_name')
          .eq('user_id', session.user.user_id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        if (data) {
          setJobDescription(data.job_last_used ?? '');
          setResumeText(data.resume_last_used ?? '');
          setSavedFileName(data.resume_file_name ?? '');
        }
      } catch (err) {
        console.error('Exception fetching user data:', err);
      }
    };

    fetchUserData();
  }, [status, session?.user?.user_id]);

  
  useEffect(() => {
    if (didHandleStripeRef.current) return;
    didHandleStripeRef.current = true;

    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success && sessionId) {
      (async () => {
        try {
          const res = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || 'Verification failed');

          const credits = data.credits ?? 0;
          setPopupType('success');
          setPopupTitle('Payment complete!');
          setPopupMessage(`You now have ${credits} credits remaining.`);
          setPopupOpen(true);

          router.replace('/backgroundinfo', { scroll: false });
        } catch (err: any) {
          console.error(err);
          setPopupType('error');
          setPopupTitle('Payment verification failed');
          setPopupMessage(`We couldn't verify your payment. Please try again or contact support at aiintervue@gmail.com`);
          setPopupOpen(true);
          router.replace('/backgroundinfo', { scroll: false });
        }
      })();
    } else if (canceled) {
      setPopupType('error');
      setPopupTitle('Payment canceled');
      setPopupMessage('Your payment was canceled. Try again or contact support at aiintervue@gmail.com');
      setPopupOpen(true);
      router.replace('/backgroundinfo', { scroll: false });
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await extractPdfText(file);
      setResumeText(text);
      setSavedFileName(file.name);
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    setResumeText('');
    setSavedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearAnalysisCache = () => {
  try {
    const keysToClear = [
      'analysis_in_progress',
      'analysis_done',
      'analysis_result',
      'analysis_key',
      'questions',
      'responses',
      'analyses',
      'save_report'
    ];
    keysToClear.forEach(k => sessionStorage.removeItem(k));
  } catch (err) {
    console.warn('Failed to clear analysis cache', err);
  }
  };

  const startGoogle = async () => {
  try {
    setIsLoading(true);
    await signIn('google', { callbackUrl: `${window.location.origin}/backgroundinfo` });
    setIsLoading(false);
  } catch (err) {
    console.error('Sign in failed', err);
    setIsLoading(false);
  }
};


  const handleStart = async () => {
  if (!jobDescription.trim() || !resumeText.trim()) return;

  setIsLoading(true);

  sessionStorage.setItem('jobDescription', jobDescription);
  sessionStorage.setItem('resume', resumeText);
  sessionStorage.setItem('numQuestions', String(numQuestions));
  sessionStorage.setItem('resumeFileName',savedFileName);
  clearAnalysisCache();
  sessionStorage.removeItem('questions');
  sessionStorage.removeItem('questionsAudio');

  router.push('/waiting-room');
};

  const isFormValid = jobDescription.trim() && resumeText.trim();

  return(
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      <LoginModal open={open} onClose={() => setOpen(false)} />
      <CreditPopup
        open={popupOpen}
        type={popupType}
        title={popupTitle}
        message={popupMessage}
        onClose={() => setPopupOpen(false)}
        actionLabel={popupType === 'success' ? 'Continue' : undefined}
        onAction={() => {
        }}
      />
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
                  {savedFileName && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-indigo-600 pb-2">
                          Resume Saved
                      </p>
                      <button
                          onClick={removeFile}
                          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-full"
                        >
                          <X className="h-4 w-4" />
                       </button>
                      </div>
                      <div className="flex items-center justify-between">
                
                        <div className="flex items-center space-x-3 text-lg">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FileText className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs text-indigo-600 truncate max-w-xs">
                              {savedFileName}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Upload a new resume to replace this one
                      </p>
                    </motion.div>
                  )}
                  
                  {resumeFile && !savedFileName && (
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
                        {savedFileName || resumeFile ? 'Upload a different resume' : 'Click to upload your resume'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Supports .pdf files
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

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

        {/* Number of Questions Card */}
        {/*<motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "tween",
            ease: "easeOut",
            duration: 0.8,
            delay: 0.25
          }}
        >
          <div className="mb-8 bg-gradient-to-b from-white to-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-indigo-600">Number of Questions</h2>
              </div>
              <p className="text-slate-600 mb-4">
                Select how many interview questions you want to practice
              </p>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value={1}>1 Question</option>
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
              </select>
            </div>
          </div>
        </motion.div>*/}


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
                You'll be asked {numQuestions} question{numQuestions > 1 ? 's' : ''} based on the job description and your background.
                </p>
                <p className='text-slate-600 mb-6 max-w-2xl mx-auto'>Each question will be recorded using your microphone.</p>

                {!session ? (
                <div className="mt-6 flex justify-center">
                    <button
                    onClick={startGoogle}
                    disabled={isLoading || status === 'loading'}
                    className={`flex items-center justify-center gap-3 px-8 py-2 rounded-xl font-medium transition ${
                        isLoading || status === 'loading'
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border border-slate-200 hover:bg-indigo-50"
                    }`}
                    >
                    <FcGoogle className="h-5 w-5" />
                    <span>{isLoading ? "Redirecting…" : "Login with Google"}</span>
                    </button>
                </div>
                ) : (
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
                        <span>Start Interview Practice (1 Credit)</span>
                        <ArrowRight className="h-5 w-5" />
                    </div>
                    )}
                </motion.button>
                )}
            </div>
            </div>
        </div>
        </motion.div>
      </div>
    </div>
  );
}