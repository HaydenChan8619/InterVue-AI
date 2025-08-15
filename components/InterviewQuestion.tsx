'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Square } from 'lucide-react';

interface InterviewQuestionProps {
  question: string;
  questionNumber: number;
  onComplete: (response: string) => void;
}

export default function InterviewQuestion({ question, questionNumber, onComplete }: InterviewQuestionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null); // 3-second read countdown

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null); // recording timer (seconds)
  const countdownRef = useRef<number | null>(null); // countdown timer id
  const mountedRef = useRef<boolean>(true); // avoid setState on unmounted when processing in background

  // Track mount/unmount to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupEverything();
    };
  }, []);

  // Start a 3-second countdown whenever the question changes (or on mount)
  useEffect(() => {
    // Reset any previous state and start countdown automatically
    cleanupEverything();
    setAudioBlob(null);
    setRecordingTime(0);
    startCountdown();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, questionNumber]);

  const cleanupEverything = () => {
    // stop recording timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // stop countdown timer
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // stop mediaRecorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    // stop media tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {
        // ignore
      }
      streamRef.current = null;
    }

    setIsRecording(false);
  };

  const startCountdown = (secs = 3) => {
    // clear any existing countdown
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setCountdown(secs);

    countdownRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          // finished countdown
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current);
            countdownRef.current = null;
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
    <div className="space-y-6">
      {/* Recording Status */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* Separate countdown display (3-second reading time) */}
            {countdown !== null && (
              <div className="text-center">
                <div className="text-sm text-gray-500">Starting in</div>
                <div className="text-4xl font-bold text-gray-800">{countdown}</div>
              </div>
            )}

            {isRecording && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                </div>
                <span className="text-red-600 font-semibold">RECORDING</span>
                <span className="text-gray-600 font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}

            {audioBlob && !isRecording && mountedRef.current && (
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-semibold">RECORDING SAVED</span>
                <span className="text-gray-600 font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}

            {isProcessing && (
              <div className="text-sm text-gray-600">Processing in background…</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-900">
            Question {questionNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <p className="text-xl text-gray-700 text-center leading-relaxed">
            {question}
          </p>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex justify-center">
            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
              >
                <Square className="mr-2 h-5 w-5" />
                End Question
              </Button>
            )}
            {/* No Start button — recording auto-starts after 3s countdown */}
            {!isRecording && countdown === null && (
              <div className="text-sm text-gray-500">Waiting…</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}