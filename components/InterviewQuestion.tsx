'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause } from 'lucide-react';

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-start recording when component mounts
    startRecording();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to transcribe audio');
      
      const { text } = await response.json();
      onComplete(text);
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      onComplete('Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
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
          <div className="flex items-center justify-center space-x-4">
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
            
            {audioBlob && !isRecording && (
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-semibold">RECORDING COMPLETE</span>
                <span className="text-gray-600 font-mono">{formatTime(recordingTime)}</span>
              </div>
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
          <div className="flex justify-center space-x-4">
            {isRecording ? (
              <Button
                onClick={stopRecording}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
              >
                <Square className="mr-2 h-5 w-5" />
                End Question
              </Button>
            ) : audioBlob ? (
              <Button
                onClick={handleSubmit}
                disabled={isProcessing}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  "Submit Answer"
                )}
              </Button>
            ) : (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}