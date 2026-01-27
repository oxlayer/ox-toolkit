import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ParsedVoiceInput, CreateTodoInput, VoiceCommand } from '@/types';
import { LocalStorageTokenStorage } from '@/lib/auth/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL + '/api';
const tokenStorage = new LocalStorageTokenStorage();

// ============================================================================
// HTML ENTITY DECODING
// ============================================================================

/**
 * Decode HTML entities in text (e.g., &#x27; -> ')
 */
function decodeHtmlEntities(text: string): string {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

// ============================================================================
// TYPES
// ============================================================================

export interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onInterim?: (interim: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export interface SpeechRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  interimTranscript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// ============================================================================
// SPEECH RECOGNITION HOOK (Using Backend Whisper API)
// ============================================================================

/**
 * Speech recognition using MediaRecorder + Backend Whisper API
 * This replaces browser's native SpeechRecognition which requires HTTPS and has network issues
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions): SpeechRecognitionState {
  const { onResult, onError } = options;

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Use refs for callbacks to avoid recreating on change
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs in sync with latest callbacks
  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  const start = useCallback(async () => {
    try {
      // Check if MediaRecorder is supported
      if (typeof window === 'undefined' || !window.MediaRecorder || !navigator.mediaDevices) {
        onErrorRef.current?.('Speech recording not supported in this browser');
        return;
      }

      setIsListening(true);
      setInterimTranscript('');
      audioChunksRef.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Whisper works best with 16kHz
        }
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        // Combine audio chunks and send to backend
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          try {
            setInterimTranscript('Transcribing...');

            const arrayBuffer = await audioBlob.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Get auth token for the request
            const token = await tokenStorage.getToken();
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE}/voice/transcribe`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                audio: base64,
                mimeType: 'audio/webm',
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Transcription failed');
            }

            const data = await response.json();
            const transcript = decodeHtmlEntities(data.text || '');

            setInterimTranscript('');
            onResultRef.current(transcript);
          } catch (error) {
            console.error('[SpeechRecognition] Transcription error:', error);
            setInterimTranscript('');
            onErrorRef.current?.(error instanceof Error ? error.message : 'Transcription failed');
          }
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      console.error('[SpeechRecognition] Start error:', error);
      setIsListening(false);
      onErrorRef.current?.(error instanceof Error ? error.message : 'Failed to start recording');
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setInterimTranscript('');
  }, []);

  const isSupported = typeof window !== 'undefined' &&
    !!window.MediaRecorder &&
    !!navigator.mediaDevices?.getUserMedia;

  return {
    isListening,
    isSupported,
    interimTranscript,
    start,
    stop,
    reset,
  };
}

// ============================================================================
// VOICE INTENT PARSER
// ============================================================================

export class VoiceIntentParser {
  /**
   * Parse voice input into structured command
   *
   * Examples:
   * - "Create a task tomorrow called send invoice"
   * - "Add todo buy groceries today"
   * - "Remind me to call mom tomorrow at 3pm"
   */
  parse(transcript: string): ParsedVoiceInput {
    const normalized = transcript.toLowerCase().trim();

    // Detect command type
    const commandType = this.detectCommandType(normalized);

    if (commandType === 'create') {
      const todo = this.parseCreateTodo(normalized);
      return {
        command: { type: 'create', todo },
        confidence: todo ? 0.85 : 0.3,
        rawText: transcript,
      };
    }

    // For other command types, return lower confidence
    return {
      command: { type: 'create' },
      confidence: 0.2,
      rawText: transcript,
    };
  }

  private detectCommandType(transcript: string): VoiceCommand['type'] {
    const completeKeywords = ['complete', 'finish', 'done', 'check'];
    const deleteKeywords = ['delete', 'remove', 'cancel'];

    if (completeKeywords.some(kw => transcript.includes(kw))) {
      return 'complete';
    }

    if (deleteKeywords.some(kw => transcript.includes(kw))) {
      return 'delete';
    }

    return 'create';
  }

  private parseCreateTodo(transcript: string): CreateTodoInput | undefined {
    // Extract title (the main task description)
    const titleMatch = this.extractTitle(transcript);
    if (!titleMatch) return undefined;

    // Extract due date
    const dueDate = this.extractDueDate(transcript);

    // Extract priority
    const priority = this.extractPriority(transcript);

    return {
      title: titleMatch,
      dueDate,
      priority,
    };
  }

  private extractTitle(transcript: string): string | undefined {
    // Remove command keywords
    const cleaned = transcript
      .replace(/^(create|add|new|remind me to|remind me|todo|task|make a|make)\s+(a\s+)?/i, '')
      .replace(/\s+(called|named|titled)\s+/gi, ' ')
      .replace(/\s+(for|today|tomorrow|on|at|in|priority|high|medium|low)\s+.*$/gi, '')
      .trim();

    return cleaned || undefined;
  }

  private extractDueDate(transcript: string): string | undefined {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateMap: Record<string, Date> = {
      'today': today,
      'tomorrow': tomorrow,
    };

    // Check for relative dates
    for (const [keyword, date] of Object.entries(dateMap)) {
      if (transcript.includes(keyword)) {
        return date.toISOString().split('T')[0];
      }
    }

    // Check for "on [day of week]"
    const dayMatch = transcript.match(/on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    if (dayMatch) {
      const targetDay = this.getNextDayOfWeek(dayMatch[1]);
      return targetDay.toISOString().split('T')[0];
    }

    return undefined;
  }

  private extractPriority(transcript: string): 1 | 2 | 3 | 4 {
    const priorityMap: Record<string, 1 | 2 | 3 | 4> = {
      'urgent': 1,
      'important': 1,
      'high': 1,
      'high priority': 1,
      'priority 1': 1,
      'medium': 2,
      'normal': 2,
      'priority 2': 2,
      'low': 4,
      'priority 4': 4,
      'optional': 4,
    };

    for (const [keyword, priority] of Object.entries(priorityMap)) {
      if (transcript.includes(keyword)) {
        return priority;
      }
    }

    return 4; // Default to low priority
  }

  private getNextDayOfWeek(dayName: string): Date {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());

    if (targetDay === -1) {
      return new Date();
    }

    const today = new Date();
    const currentDay = today.getDay();

    const daysUntilTarget = (targetDay + 7 - currentDay) % 7 || 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilTarget);

    return nextDate;
  }
}

// ============================================================================
// VOICE INPUT HOOK
// ============================================================================

export interface UseVoiceInputOptions {
  onCommand: (input: ParsedVoiceInput) => void;
  lang?: string;
}

export interface VoiceInputState extends SpeechRecognitionState {
  transcript: string;
  setTranscript: (text: string) => void;
  submit: () => void;
}

export function useVoiceInput(options: UseVoiceInputOptions): VoiceInputState {
  const { onCommand } = options;

  const [transcript, setTranscript] = useState('');
  const parser = useMemo(() => new VoiceIntentParser(), []);

  const handleResult = useCallback((text: string) => {
    setTranscript(text);

    // Parse and invoke command
    const parsed = parser.parse(text);
    onCommand(parsed);
  }, [parser, onCommand]);

  const speech = useSpeechRecognition({
    onResult: handleResult,
    onError: (error) => {
      console.error('Voice input error:', error);
    },
  });

  const submit = () => {
    if (transcript.trim()) {
      const parsed = parser.parse(transcript);
      onCommand(parsed);
      setTranscript('');
    }
  };

  return {
    ...speech,
    transcript,
    setTranscript,
    submit,
  };
}
