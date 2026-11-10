import { requireOptionalNativeModule } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export type SpeechMode = 'native' | 'recording' | 'unavailable';

export type SpeechFailureCode =
  | 'permission'
  | 'unavailable'
  | 'network'
  | 'cancelled'
  | 'no-speech'
  | 'failed';

export class SpeechCaptureError extends Error {
  constructor(
    readonly code: SpeechFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'SpeechCaptureError';
  }
}

type SpeechResultEvent = {
  isFinal?: boolean;
  results?: Array<{ transcript?: string }>;
};

type SpeechErrorEvent = {
  error?: string;
  message?: string;
};

type SpeechVolumeEvent = {
  value?: number;
};

type NativeSpeechModule = {
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort?: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: (
    eventName: 'result' | 'error' | 'end' | 'volumechange',
    listener: (event: SpeechResultEvent & SpeechErrorEvent & SpeechVolumeEvent) => void,
  ) => { remove: () => void };
};

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: WebSpeechResultEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type WebSpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript?: string }> & { isFinal?: boolean }>;
};

const CONTEXTUAL_STRINGS = [
  'Cement',
  'UltraTech',
  'ACC',
  'Ambuja',
  'Bricks',
  'AAC blocks',
  'Sand',
  'RMC',
  'Waterproofing',
  'Fevicol',
  'Putty',
  'Stone chips',
  'सीमेंट',
  'ईंट',
  'रेत',
];

let cachedNativeModule: NativeSpeechModule | null | undefined;
let listenersBound = false;
let active:
  | {
      resolve: (transcript: string) => void;
      reject: (error: SpeechCaptureError) => void;
      settled: boolean;
      partial: string;
      onPartial?: (text: string) => void;
      onLevel?: (level: number) => void;
    }
  | null = null;
let webRecognition: WebSpeechRecognition | null = null;

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

function getNativeSpeechModule(): NativeSpeechModule | null {
  if (cachedNativeModule !== undefined) return cachedNativeModule;
  if (Platform.OS === 'web') {
    cachedNativeModule = null;
    return null;
  }
  try {
    if (!requireOptionalNativeModule('ExpoSpeechRecognition')) {
      cachedNativeModule = null;
      return null;
    }
    // Loaded only after the native module is confirmed present.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speech = require('expo-speech-recognition') as {
      ExpoSpeechRecognitionModule: NativeSpeechModule;
    };
    cachedNativeModule = speech.ExpoSpeechRecognitionModule;
    return cachedNativeModule;
  } catch {
    cachedNativeModule = null;
    return null;
  }
}

function getWebSpeechConstructor(): (new () => WebSpeechRecognition) | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const webWindow = window as Window & {
    SpeechRecognition?: new () => WebSpeechRecognition;
    webkitSpeechRecognition?: new () => WebSpeechRecognition;
  };
  return webWindow.SpeechRecognition ?? webWindow.webkitSpeechRecognition ?? null;
}

/** Native on-device recognition when the dev build includes it. Otherwise record-and-transcribe. */
export function speechMode(): SpeechMode {
  if (Platform.OS === 'web') {
    return getWebSpeechConstructor() ? 'native' : 'unavailable';
  }
  return getNativeSpeechModule() ? 'native' : 'recording';
}

export function recognitionLanguage(appLanguage: 'en' | 'hi'): string {
  return appLanguage === 'hi' ? 'hi-IN' : 'en-IN';
}

function settle(transcript: string | null, error?: SpeechCaptureError) {
  const current = active;
  if (!current || current.settled) return;
  current.settled = true;
  active = null;
  if (error) current.reject(error);
  else current.resolve(transcript?.trim() ?? current.partial.trim());
}

function bindNativeListeners(module: NativeSpeechModule) {
  if (listenersBound) return;
  listenersBound = true;

  module.addListener('result', (event) => {
    const text = event.results?.[0]?.transcript?.trim() ?? '';
    if (!active || !text) return;
    active.partial = text;
    active.onPartial?.(text);
    if (event.isFinal) settle(text);
  });

  module.addListener('volumechange', (event) => {
    const value = event.value ?? -2;
    const level = Math.max(0, Math.min(1, (value + 2) / 12));
    active?.onLevel?.(level);
  });

  module.addListener('error', (event) => {
    const code = event.error ?? 'unknown';
    if (code === 'aborted') {
      settle(null, new SpeechCaptureError('cancelled', 'Cancelled'));
      return;
    }
    if (code === 'no-speech' || code === 'speech-timeout') {
      settle('');
      return;
    }
    if (code === 'not-allowed') {
      settle(
        null,
        new SpeechCaptureError(
          'permission',
          'Microphone access is needed so Bajriwala can hear your search.',
        ),
      );
      return;
    }
    if (code === 'network') {
      settle(
        null,
        new SpeechCaptureError('network', 'No internet connection. Check your network and try again.'),
      );
      return;
    }
    settle(null, new SpeechCaptureError('failed', 'Could not hear that. Please try again.'));
  });

  module.addListener('end', () => {
    settle(active?.partial ?? '');
  });
}

export async function startNativeRecognition(options: {
  lang: string;
  onPartial?: (text: string) => void;
  onLevel?: (level: number) => void;
}): Promise<string> {
  if (Platform.OS === 'web') return startWebRecognition(options);

  const module = getNativeSpeechModule();
  if (!module) {
    throw new SpeechCaptureError('unavailable', 'On-device speech recognition is not in this build.');
  }

  cancelNativeRecognition();
  bindNativeListeners(module);

  const permission = await module.requestPermissionsAsync();
  if (!permission.granted) {
    throw new SpeechCaptureError(
      'permission',
      'Microphone access is needed so Bajriwala can hear your search.',
    );
  }

  return new Promise<string>((resolve, reject) => {
    active = {
      resolve,
      reject,
      settled: false,
      partial: '',
      onPartial: options.onPartial,
      onLevel: options.onLevel,
    };
    try {
      module.start({
        lang: options.lang,
        interimResults: true,
        continuous: false,
        addsPunctuation: false,
        contextualStrings: CONTEXTUAL_STRINGS,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 120 },
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'web_search',
          EXTRA_ENABLE_LANGUAGE_DETECTION: true,
          EXTRA_LANGUAGE_DETECTION_ALLOWED_LANGUAGES: ['en-IN', 'hi-IN'],
          EXTRA_ENABLE_LANGUAGE_SWITCH: 'balanced',
          EXTRA_LANGUAGE_SWITCH_ALLOWED_LANGUAGES: ['en-IN', 'hi-IN'],
        },
      });
    } catch {
      settle(null, new SpeechCaptureError('failed', 'Could not start listening.'));
    }
  });
}

function startWebRecognition(options: {
  lang: string;
  onPartial?: (text: string) => void;
}): Promise<string> {
  const SpeechRecognition = getWebSpeechConstructor();
  if (!SpeechRecognition) {
    return Promise.reject(
      new SpeechCaptureError('unavailable', 'Voice search is not available in this browser.'),
    );
  }

  cancelNativeRecognition();
  return new Promise<string>((resolve, reject) => {
    active = {
      resolve,
      reject,
      settled: false,
      partial: '',
      onPartial: options.onPartial,
    };
    try {
      const recognition = new SpeechRecognition();
      webRecognition = recognition;
      recognition.lang = options.lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const text = last?.[0]?.transcript?.trim() ?? '';
        if (!text || !active) return;
        active.partial = text;
        active.onPartial?.(text);
        if (last?.isFinal) settle(text);
      };
      recognition.onerror = (event) => {
        if (event.error === 'aborted') {
          settle(null, new SpeechCaptureError('cancelled', 'Cancelled'));
          return;
        }
        if (event.error === 'no-speech') {
          settle('');
          return;
        }
        if (event.error === 'not-allowed') {
          settle(
            null,
            new SpeechCaptureError(
              'permission',
              'Microphone access is needed so Bajriwala can hear your search.',
            ),
          );
          return;
        }
        settle(null, new SpeechCaptureError('failed', 'Could not hear that. Please try again.'));
      };
      recognition.onend = () => {
        webRecognition = null;
        settle(active?.partial ?? '');
      };
      recognition.start();
    } catch {
      settle(null, new SpeechCaptureError('failed', 'Could not start listening.'));
    }
  });
}

export function stopNativeRecognition() {
  try {
    webRecognition?.stop();
    getNativeSpeechModule()?.stop();
  } catch {
    settle(active?.partial ?? '');
  }
}

export function cancelNativeRecognition() {
  const current = active;
  try {
    if (webRecognition?.abort) webRecognition.abort();
    else webRecognition?.stop();
    getNativeSpeechModule()?.abort?.();
    getNativeSpeechModule()?.stop();
  } catch {
    // The recognizer may already have stopped.
  }
  webRecognition = null;
  if (current && !current.settled) {
    current.settled = true;
    active = null;
    current.reject(new SpeechCaptureError('cancelled', 'Cancelled'));
  }
}
