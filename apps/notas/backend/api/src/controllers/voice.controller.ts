/**
 * Voice Controller
 *
 * Handles speech-to-text transcription using Groq's Whisper API.
 */

import type { Context } from 'hono';
import { getWhisperService, WhisperService } from '../services/whisper.service.js';

interface TranscribeRequest {
  audio: string; // base64 encoded audio
  mimeType?: string; // audio MIME type, defaults to audio/webm
  language?: string; // ISO-639-1 language code
  prompt?: string; // Optional prompt to guide transcription
}

interface TranscribeResponse {
  success: true;
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

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export class VoiceController {
  /**
   * POST /voice/transcribe
   *
   * Transcribe audio to text using Whisper
   *
   * @example
   * Request body:
   * {
   *   "audio": "base64_encoded_audio_data",
   *   "mimeType": "audio/webm",
   *   "language": "en"
   * }
   */
  async transcribe(c: Context): Promise<Response> {
    try {
      const body = await c.req.json<TranscribeRequest>();

      // Validate request
      if (!body.audio) {
        const error: ErrorResponse = {
          success: false,
          error: 'MISSING_AUDIO',
          message: 'Audio data is required',
        };
        return c.json(error, 400);
      }

      const mimeType = body.mimeType || 'audio/webm';

      // Validate MIME type
      if (!WhisperService.isSupportedFormat(mimeType)) {
        const error: ErrorResponse = {
          success: false,
          error: 'UNSUPPORTED_FORMAT',
          message: `Unsupported audio format: ${mimeType}. Supported formats: ${WhisperService.getSupportedFormats().join(', ')}`,
        };
        return c.json(error, 400);
      }

      // Check if Whisper is configured
      if (!getWhisperService().isConfigured()) {
        const error: ErrorResponse = {
          success: false,
          error: 'SERVICE_NOT_CONFIGURED',
          message: 'Whisper service is not configured. Please set GROQ_API_KEY environment variable.',
        };
        return c.json(error, 503);
      }

      // Transcribe audio
      const result = await getWhisperService().transcribeBase64(
        body.audio,
        mimeType,
        {
          language: body.language,
          prompt: body.prompt,
          response_format: 'verbose_json',
        }
      );

      const response: TranscribeResponse = {
        success: true,
        text: result.text,
        duration: result.duration,
        language: result.language,
        words: result.words,
      };

      return c.json(response);
    } catch (error) {
      console.error('[VoiceController] Transcription error:', error);

      const errorResponse: ErrorResponse = {
        success: false,
        error: 'TRANSCRIPTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to transcribe audio',
      };

      return c.json(errorResponse, 500);
    }
  }

  /**
   * GET /voice/config
   *
   * Get voice service configuration and capabilities
   */
  async getConfig(c: Context): Promise<Response> {
    return c.json({
      success: true,
      configured: getWhisperService().isConfigured(),
      model: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
      supportedFormats: WhisperService.getSupportedFormats(),
      supportedLanguages: WhisperService.getSupportedLanguages(),
    });
  }

  /**
   * GET /voice/health
   *
   * Check if voice service is healthy
   */
  async health(c: Context): Promise<Response> {
    const isHealthy = getWhisperService().isConfigured();

    return c.json({
      success: true,
      healthy: isHealthy,
      service: 'whisper',
      provider: 'groq',
    });
  }
}
