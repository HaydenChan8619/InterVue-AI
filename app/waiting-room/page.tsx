'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import CreditPopup from '@/components/CreditPopup';
import { Volume2, Mic, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react'

export default function WaitingRoomPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<number>(0);
  const [message, setMessage] = useState<string>('Preparing...');
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('info');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupActionLabel, setPopupActionLabel] = useState('');
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const processingRef = useRef(false);

  const [questionsReady, setQuestionsReady] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);

  const jobDescription = (typeof window !== 'undefined' ? sessionStorage.getItem('jobDescription') : '') || '';
  const resumeText = (typeof window !== 'undefined' ? sessionStorage.getItem('resume') : '') || '';
  const numQuestionsStr = (typeof window !== 'undefined' ? sessionStorage.getItem('numQuestions') : '') || '3';
  const numQuestions = Number(numQuestionsStr || 3);

  const handleContinue = async () => {
    if (!readyToStart) return;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    router.push('/interview');
  };

  const handlePricing = async () => {
    router.push('/buy-credits');
  }

  const handleBack = async () => {
    router.push('backgroundinfo');
  }

  const STEPS = [
    'Checking account & tokens',
    'Reserving a credit',
    'Generating questions',
    'Generating audio (TTS)',
    'Logging action',
    'Ready to start'
  ];

  const readyToStart = micGranted === true && questionsReady && ttsReady;

  useEffect(() => {
    const requestMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setMicGranted(true);
      } catch (err) {
        console.warn('Microphone permission denied or not available', err);
        setMicGranted(false);
      }
    };

    requestMic();
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      setPopupType('error');
      setPopupTitle('Not signed in');
      setPopupMessage('Please sign in to continue.');
      setPopupOpen(true);
      return;
    }

    if (!isProcessing) {
      startProcessing();
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [session, status]);

  const startProcessing = async () => {
    if (processingRef.current) return 
    processingRef.current = true;
    setIsProcessing(true);
    setQuestionsReady(false);
    setTtsReady(false);

    if (!jobDescription || !resumeText) {
      setPopupType('error');
      setPopupTitle('Missing data');
      setPopupMessage('Job description or resume missing. Please go back and re-enter them.');
      setPopupOpen(true);
      setIsProcessing(false);
      return;
    }

    try {
      setStep(0);
      setMessage(STEPS[0]);
      const userId = session?.user?.user_id;
      if (!userId) throw new Error('No session user id');

      await supabase
        .from('users')
        .update({
          job_last_used: jobDescription,
          resume_last_used: resumeText,
          resume_file_name: sessionStorage.getItem('resumeFileName') ?? null
        })
        .eq('user_id', userId);

      const { data: userRow, error: selectError } = await supabase
        .from('users')
        .select('tokens_remaining, tokens_used')
        .eq('user_id', userId)
        .single();

      if (selectError || !userRow) {
        throw new Error('Failed to read user tokens');
      }

      if ((userRow.tokens_remaining ?? 0) < 1) {
        throw new Error('Not enough credits');
      }

      setStep(1);
      setMessage(STEPS[1]);
      const { data: updatedUsers, error: updateError } = await supabase
        .from('users')
        .update({
          tokens_remaining: userRow.tokens_remaining - 1,
          tokens_used: (userRow.tokens_used ?? 0) + 1
        })
        .eq('user_id', userId)
        .gte('tokens_remaining', 1)
        .select();

      if (updateError) {
        throw new Error('Token deduction failed');
      }

      setStep(2);
      setMessage(STEPS[2]);
      const genRes = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resume: resumeText, numQuestions })
      });

      if (!genRes.ok) throw new Error('Failed to generate questions');

      const { questions } = await genRes.json();
      sessionStorage.setItem('questions', JSON.stringify(questions));
      setQuestionsReady(true);

      setStep(3);
      setMessage(STEPS[3]);
      const audioFiles: string[] = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        setMessage(`Generating audio ${i + 1} / ${questions.length}...`);
        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: q,
            voiceName: 'en-US-Chirp3-HD-Achird',
            audioEncoding: 'MP3'
          })
        });

        if (!ttsResponse.ok) throw new Error('TTS request failed');
        const { audioContent } = await ttsResponse.json();
        audioFiles.push(audioContent);
      }
      sessionStorage.setItem('questionsAudio', JSON.stringify(audioFiles));
      setTtsReady(true);

      setStep(4);
      setMessage(STEPS[4]);
      const actionDetails = {
        job_last_used: jobDescription,
        resume_last_used: resumeText,
        numQuestions,
        questionsPreview: JSON.parse(sessionStorage.getItem('questions') || '[]'),
      };

      const { data: logData, error: logError } = await supabase
        .from('action_log')
        .insert([{
          user_id: userId,
          type: 'interview_initalized',
          details: actionDetails
        }])
        .select();

      if (logError) {
        try {
          await supabase
            .from('users')
            .update({ tokens_remaining: userRow.tokens_remaining })
            .eq('user_id', userId);
        } catch (restoreErr) {
          console.error('Failed to restore token', restoreErr);
        }
        throw new Error('Failed to write action log');
      }

      setStep(5);
      setMessage('All set — ready to start!');
    } catch (err: any) {
      console.error('Waiting room processing error', err);
      setPopupType('error');
      setPopupTitle('Processing failed');
      setPopupMessage(err?.message || 'An unexpected error occurred. Please try again.');
      setPopupActionLabel('See Pricing');
      setPopupOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'tween',
        ease: 'easeInOut',
        duration: 0.45,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <CreditPopup
        open={popupOpen}
        type={popupType}
        title={popupTitle}
        message={popupMessage}
        actionLabel={popupActionLabel}
        onClose={() => setPopupOpen(false)}
        onAction={() => handlePricing()}
        onBack={() => handleBack()}
      />

      <div className="max-w-3xl mx-auto pt-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.h1 variants={itemVariants} className="text-2xl font-bold text-indigo-600">
            Waiting Room
          </motion.h1>
          <motion.p variants={itemVariants} className="text-slate-600 mt-2">
            We are preparing your interview — this only takes a few seconds.
          </motion.p>
        </motion.div>

        <ProcessSection />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="relative mt-8 bg-white rounded-2xl shadow-md border border-indigo-100 p-6 z-10"
        >
          <div className="mt-2">
            <div className="flex items-center justify-center text-xl font-bold text-indigo-600">Readiness</div>

            <motion.div
              className="mt-4 flex items-start gap-4"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="flex-1 min-w-0 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <motion.div
                    variants={{ hidden: { scale: 0.9, opacity: 0.6 }, visible: { scale: 1, opacity: 1, transition: { duration: 0.35 } } }}
                    className={`w-3 h-3 rounded-full ${questionsReady ? 'bg-green-500' : 'bg-slate-300'}`}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Questions generated</div>
                    <div className="text-xs text-slate-400">{questionsReady ? 'Ready' : (isProcessing ? 'Generating...' : 'Pending')}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex-1 min-w-0 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <motion.div
                    variants={{ hidden: { scale: 0.9, opacity: 0.6 }, visible: { scale: 1, opacity: 1, transition: { duration: 0.35, delay: 0.05 } } }}
                    className={`w-3 h-3 rounded-full ${ttsReady ? 'bg-green-500' : 'bg-slate-300'}`}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-700">Audio (TTS)</div>
                    <div className="text-xs text-slate-400">{ttsReady ? 'Ready' : (isProcessing ? 'Generating...' : 'Pending')}</div>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex-1 min-w-0 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <motion.div
                    variants={{ hidden: { scale: 0.9, opacity: 0.6 }, visible: { scale: 1, opacity: 1, transition: { duration: 0.35, delay: 0.1 } } }}
                    className={`w-3 h-3 rounded-full ${micGranted === true ? 'bg-green-500' : 'bg-slate-300'}`}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-700">Microphone permission</div>

                    {micGranted === true ? (
                      <div className="text-xs text-slate-400">Granted</div>
                    ) : (
                      <div className="mt-2 flex items-center justify-center">
                        <motion.button
                        onClick={async () => {
                            try {
                              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                              mediaStreamRef.current = stream;
                              setMicGranted(true);
                            } catch (err) {
                              setMicGranted(false);
                            }
                          }}
                        initial={{ scale: 1 }}
                        whileHover={readyToStart ? { scale: 1.03 } : {}}
                        transition={{ duration: 0.12 }}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm ${
                            readyToStart ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                        >
                        <span>Give Permission</span>
                        <ArrowRight className="h-4 w-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>

          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <motion.button
              onClick={handleContinue}
              disabled={!readyToStart}
              aria-disabled={!readyToStart}
              initial={{ scale: 1 }}
              whileHover={readyToStart ? { scale: 1.03 } : {}}
              transition={{ duration: 0.12 }}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm ${
                readyToStart ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{readyToStart ? 'Start Interview' : 'Waiting for setup'}</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const ProcessSection: React.FC = () => {
  return (
    <motion.div 
      className="mt-16 relative max-w-5xl mx-auto px-4"
      id="process"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="absolute -inset-4 bg-indigo-600 rounded-2xl opacity-20 blur-xl z-0"></div>
      <div className="relative bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-indigo-600 mb-2">What to expect</h2>
          <p className="text-sm text-slate-600">A quick overview so you know how the interview flow works.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          <ProcessStep 
            number={1}
            title="Listen"
            description="Open your speakers to listen to the question."
            icon={<Volume2 className="h-8 w-8" aria-hidden />}
          />
          
          <div className="hidden md:flex items-center justify-center text-indigo-600">
            <ArrowRight className="h-8 w-8" aria-hidden />
          </div>
          
          <ProcessStep 
            number={2}
            title="Answer"
            description="Answer the question to the best of your abilities."
            icon={<Mic className="h-8 w-8" aria-hidden />}
          />
          
          <div className="hidden md:flex items-center justify-center text-indigo-600">
            <ArrowRight className="h-8 w-8" aria-hidden />
          </div>
          
          <ProcessStep 
            number={3}
            title="Complete"
            description="Click 'End Question' at the bottom when you're done to move to the next question."
            icon={(
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-indigo-600" aria-hidden />
              </div>
            )}
          />
        </div>
      </div>
    </motion.div>
  );
};

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ number, title, description, icon }) => {
  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50 to-white rounded-xl p-4 border border-indigo-100">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg mb-3">
          {number}
        </div>
        <div className="text-indigo-600 mb-3">{icon}</div>
        <h3 className="text-lg font-semibold text-indigo-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
};