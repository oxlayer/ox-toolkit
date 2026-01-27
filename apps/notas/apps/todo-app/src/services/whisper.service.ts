/**
 * Whisper Speech-to-Text Service
 *
 * Uses Groq's Whisper API (whisper-large-v3-turbo) for fast, accurate speech recognition.
 * Supports multiple audio formats and languages.
 */

import { ENV } from '../config/app.config.js';

interface WhisperTranscribeOptions {
  language?: string; // ISO-639-1 language code (e.g., 'en', 'es', 'fr'). Auto-detect if not specified.
  prompt?: string; // Optional text to guide the model (useful for specific vocabulary/context)
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number; // 0-1, lower for more focused, higher for more creative
}

interface WhisperResponse {
  text: string;
  duration?: number;
  language?: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

interface GroqWhisperApiResponse {
  text: string;
  task: string;
  language: string;
  duration: number;
  words: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}

/**
 * Whisper Speech-to-Text Service
 */
export class WhisperService {
  private apiKey: string | undefined;
  private model: string;
  private apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';

  constructor() {
    this.apiKey = ENV.GROQ_API_KEY;
    this.model = ENV.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo';
  }

  /**
   * Check if Whisper service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Transcribe audio buffer to text using Groq's Whisper API
   *
   * @param audioBuffer - Audio data as ArrayBuffer or Buffer
   * @param mimeType - Audio MIME type (e.g., 'audio/webm', 'audio/mp3', 'audio/wav')
   * @param options - Transcription options
   * @returns Transcribed text with metadata
   */
  async transcribe(
    audioBuffer: ArrayBuffer | Buffer,
    mimeType: string,
    options: WhisperTranscribeOptions = {}
  ): Promise<WhisperResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API key is not configured. Please set GROQ_API_KEY environment variable.');
    }

    // Create a Blob from the buffer
    const blob = new Blob([audioBuffer], { type: mimeType });

    // Prepare form data
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', this.model);

    if (options.language) {
      formData.append('language', options.language);
    }

    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    if (options.response_format) {
      formData.append('response_format', options.response_format);
    }

    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }

    // Add timestamp granularities for verbose_json format
    if (options.response_format === 'verbose_json') {
      formData.append('timestamp_granularities[]', 'word');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${error}`);
      }

      const data = (await response.json()) as GroqWhisperApiResponse;

      // Transform Groq response to our format
      return {
        text: data.text,
        duration: data.duration,
        language: data.language,
        words: data.words?.map(w => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: 0.95, // Groq doesn't provide per-word confidence
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Transcribe audio from a base64 string
   * Useful for web clients that send audio as base64
   */
  async transcribeBase64(
    base64Audio: string,
    mimeType: string,
    options: WhisperTranscribeOptions = {}
  ): Promise<WhisperResponse> {
    // Remove data URL prefix if present
    const base64Data = base64Audio.replace(/^data:audio\/[^;]+;base64,/, '');

    // Convert base64 to buffer
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return this.transcribe(bytes.buffer, mimeType, options);
  }

  /**
   * Get supported audio formats
   */
  static getSupportedFormats(): string[] {
    return [
      'flac',
      'mp3',
      'mp4',
      'mpeg',
      'mpga',
      'm4a',
      'ogg',
      'wav',
      'webm',
    ];
  }

  /**
   * Get supported languages (common ones)
   * Full list: https://github.com/openai/whisper/blob/main/whisper/tokenizer.py
   */
  static getSupportedLanguages(): Record<string, string> {
    return {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      nl: 'Dutch',
      ru: 'Russian',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      hi: 'Hindi',
      sv: 'Swedish',
      no: 'Norwegian',
      da: 'Danish',
      fi: 'Finnish',
      pl: 'Polish',
      tr: 'Turkish',
      vi: 'Vietnamese',
      th: 'Thai',
      id: 'Indonesian',
    };
  }

  /**
   * Validate MIME type is supported
   */
  static isSupportedFormat(mimeType: string): boolean {
    const supportedFormats = [
      'audio/flac',
      'audio/mp3',
      'audio/mp4',
      'audio/mpeg',
      'audio/mpga',
      'audio/m4a',
      'audio/ogg',
      'audio/wav',
      'audio/webm',
    ];
    return supportedFormats.includes(mimeType);
  }
}

// Singleton instance
let whisperServiceInstance: WhisperService | null = null;

export function getWhisperService(): WhisperService {
  if (!whisperServiceInstance) {
    whisperServiceInstance = new WhisperService();
  }
  return whisperServiceInstance;
}
