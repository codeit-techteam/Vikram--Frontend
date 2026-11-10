import axios from 'axios';

import { api } from '@services/api';
import type { SpeechUtterance } from '@hooks/useSpeechCapture';

export interface VoiceNavigation {
  type: 'category_listing' | 'product_detail' | 'search' | 'none';
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  productSlug?: string;
  productId?: string;
  query?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface VoiceChoice {
  label: string;
  navigation: VoiceNavigation;
}

export interface VoiceSearchResolution {
  transcript: string;
  intent: 'category_search' | 'product_search' | 'clarify' | 'no_results';
  code: 'ok' | 'unclear' | 'no_results' | 'clarify' | 'out_of_stock';
  query: string;
  message: string;
  autoNavigate: boolean;
  category: { id: string; slug: string; name: string; nameHi?: string | null } | null;
  brand: string | null;
  filters: {
    brand?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  availability: {
    asked: boolean;
    status: 'in_stock' | 'out_of_stock' | 'unknown';
    inStockCount: number | null;
  };
  total: number;
  navigation: VoiceNavigation | null;
  choices: VoiceChoice[];
}

interface VoiceRequest {
  transcript: string;
  language?: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
}

function apiMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) {
    return 'No internet connection. Check your network and try again.';
  }
  if (error.response.status === 404) {
    return 'Voice search is not on this server yet. Deploy the latest Bajriwala backend, then try again.';
  }
  const data = error.response.data as { message?: string; code?: string } | undefined;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (error.code === 'ECONNABORTED') return 'That took too long. Please try again.';
  return fallback;
}

export async function resolveVoiceSearch(request: VoiceRequest): Promise<VoiceSearchResolution> {
  try {
    const response = await api.post<{ data: VoiceSearchResolution }>(
      '/search/voice',
      request,
      { timeout: 20000 },
    );
    const data = response.data?.data;
    if (!data?.code) {
      throw new Error('Voice search returned an unexpected response.');
    }
    return data;
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) throw error;
    throw new Error(apiMessage(error, 'Could not search the catalog. Please try again.'));
  }
}

export async function transcribeVoiceRecording(
  utterance: SpeechUtterance,
  language?: string,
): Promise<string> {
  if (!utterance.audioUri) {
    throw new Error('No speech detected. Please try again.');
  }

  const body = new FormData();
  body.append('file', {
    uri: utterance.audioUri,
    name: utterance.filename ?? 'bajriwala-voice.m4a',
    type: utterance.mimeType ?? 'audio/m4a',
  } as unknown as Blob);
  if (language) body.append('language', language);

  try {
    const response = await api.post<{ data: { transcript?: string } }>(
      '/search/voice/transcribe',
      body,
      {
        timeout: 25000,
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      },
    );
    const transcript = response.data?.data?.transcript?.trim() ?? '';
    if (!transcript) throw new Error('No speech detected. Please try again.');
    return transcript;
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) throw error;
    throw new Error(apiMessage(error, 'Could not understand the recording. Please try again.'));
  }
}
