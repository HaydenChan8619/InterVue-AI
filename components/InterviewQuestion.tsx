'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';
import { motion } from 'framer-motion';

interface InterviewQuestionProps {
  question: string;
  questionNumber: number;
  onComplete: (response: string) => void;
  audioSrc?: string; 
}

export default function InterviewQuestion({ question, questionNumber, onComplete, audioSrc, }: InterviewQuestionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null); // 3-second read countdown

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null); // recording timer (seconds)
  const countdownIntervalRef = useRef<number | null>(null); // countdown timer id
  const mountedRef = useRef<boolean>(true); // avoid setState on unmounted when processing in background

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  // Track mount/unmount to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    resetForNewQuestion();

    return () => {
      mountedRef.current = false;
      cleanupEverything();
    };
  }, [question, questionNumber, audioSrc]);

  const resetForNewQuestion = () => {
    cleanupEverything();
    setAudioBlob(null);
    setRecordingTime(0);

    if (audioSrc) {
      playTtsThenRecord(audioSrc);
    } else {
      // fallback to 3-second read countdown
      startCountdown(3);
    }
  };

    const cleanupEverything = () => {
    // recording timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // countdown interval
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    // stop mediaRecorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }
    // stop media tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    // stop audio playback
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.src = '';
      } catch (e) {}
      audioElRef.current = null;
    }

    setIsRecording(false);
    setCountdown(null);
  };

  const startCountdown = (secs = 3) => {
    // clear any existing countdown
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    setCountdown(secs);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          // finished countdown
          if (countdownIntervalRef.current) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setCountdown(null);
          // start recording after countdown
          startRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playTtsThenRecord = (src: string) => {
    // create audio element
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioElRef.current = audio;

    // when metadata loaded, set initial countdown to Math.ceil(duration)
    audio.addEventListener('loadedmetadata', () => {
      const duration = isFinite(audio.duration) ? Math.ceil(audio.duration) : null;
      if (duration) {
        setCountdown(duration);
        // also start a per-second UI tick to show remaining seconds
        if (countdownIntervalRef.current) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        countdownIntervalRef.current = window.setInterval(() => {
          setCountdown(prev => {
            if (prev === null) return null;
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                window.clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // if no duration available, show null until ended
        setCountdown(null);
      }
    });

        // when audio finishes, clear countdown and start recording
    audio.addEventListener('ended', () => {
      setCountdown(null);
      startRecording();
    });

    audio.addEventListener('error', (e) => {
      console.warn('Audio playback error, fallback to 3s countdown', e);
      // fallback to 3s countdown
      startCountdown(3);
    });

    // Try to play. If autoplay blocked, fall back to asking user to click (or run 3s countdown)
    (async () => {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Autoplay blocked or playback failed, falling back to countdown', err);
        // fallback to 3-second countdown so user can start
        startCountdown(3);
      }
    })();
  };

  const startRecording = async () => {
    if (isRecording) return;

    // ensure previous things are cleared
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    audioChunksRef.current = [];
    setAudioBlob(null);
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops we create the blob and upload automatically
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        // Fire-and-forget upload; allow parent to move on while we process
        void uploadBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // start per-second recording timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    // clear the visual timer here; onstop will handle upload
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);

    // stop tracks (on some browsers stopping mediaRecorder stops them but ensure)
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {
        // ignore
      }
      streamRef.current = null;
    }
  };

  const uploadBlob = async (blob: Blob) => {
    // mark processing but DO NOT block UI; parent can move to next question
    if (mountedRef.current) setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, `question-${questionNumber}-${Date.now()}.wav`);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to transcribe audio');

      const { text } = await response.json();

      // Pass transcription up even if this component has unmounted
      onComplete(text);

      // Reset local state only if still mounted; DO NOT auto-start next countdown here
      if (mountedRef.current) {
        setAudioBlob(null);
        audioChunksRef.current = [];
        setRecordingTime(0);
      }

    } catch (error) {
      console.error('Error transcribing audio:', error);
      if (mountedRef.current) {
        // surface an error result but don't block progression
        onComplete('Failed to transcribe audio');
      }
    } finally {
      if (mountedRef.current) setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

return (
    
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}>
      {/* Recording Status */}
      <Card className="bg-white/80 backdrop-blur-sm border border-indigo-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            {countdown !== null && countdown > 0 && (
              <motion.div className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className="text-sm text-indigo-600">Playing question</div>
              </motion.div>
            )}

            {countdown === null && !isRecording && !audioBlob && !isProcessing && (
              <div className="text-sm text-indigo-600">Waiting for your response...</div>
            )}

            {isRecording && (
              <motion.div className="flex items-center space-x-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="relative">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <span className="text-red-600 font-semibold">RECORDING</span>
              </motion.div>
            )}

            {audioBlob && !isRecording && (
              <motion.div className="flex items-center space-x-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-semibold">RECORDING SAVED</span>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <div className="text-sm text-indigo-600 mb-2">Analyzing your response</div>
                <div className="flex space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div key={i} className="w-2 h-2 bg-indigo-600 rounded-full" animate={{ y: [0, -10, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question card */}
      <Card className="bg-white border border-indigo-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-indigo-600">Question {questionNumber}</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <motion.p className="text-xl text-gray-700 text-center leading-relaxed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
            {question}
          </motion.p>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="bg-white/60 backdrop-blur-sm border border-indigo-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-center">
            {isRecording && (
              <Button onClick={stopRecording} size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 shadow-lg">
                <Square className="mr-2 h-5 w-5" />
                End Question
              </Button>
            )}

            {audioBlob && !isRecording && !isProcessing && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Button onClick={stopRecording} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 shadow-lg">
                  Next Question
                </Button>
              </motion.div>
            )}

            {!isRecording && countdown === null && !audioBlob && !isProcessing && (
              <div className="text-sm text-indigo-600">Waiting for your response...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}