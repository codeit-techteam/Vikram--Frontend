import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type SpeechResultEvent = {
  isFinal?: boolean;
  results?: Array<{ transcript?: string }>;
};

type SpeechErrorEvent = {
  error?: string;
};

type NativeSpeechModule = {
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    addsPunctuation: boolean;
  }) => void;
  stop: () => void;
  abort?: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: (
    eventName: 'result' | 'error' | 'end',
    listener: (event: SpeechResultEvent & SpeechErrorEvent) => void,
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

let cachedNativeModule: NativeSpeechModule | null | undefined;

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

    // Loaded only after the native module is confirmed present (not Expo Go).
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

export function useVoiceSearchInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const webRecognitionRef = useRef<WebSpeechRecognition | null>(null);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    const module = getNativeSpeechModule();
    if (!module) return;

    const resultSub = module.addListener('result', (event) => {
      const text = event.results?.[0]?.transcript?.trim();
      if (!text) return;
      if (event.isFinal) {
        onTranscriptRef.current(text);
        try {
          module.stop();
        } catch {
          // Recognition may already have ended.
        }
        setIsListening(false);
      }
    });

    const errorSub = module.addListener('error', (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setIsListening(false);
        return;
      }
      setError(
        event.error === 'not-allowed'
          ? 'Microphone permission is needed for voice search'
          : 'Could not hear that. Try again.',
      );
      setIsListening(false);
    });

    const endSub = module.addListener('end', () => {
      setIsListening(false);
    });

    return () => {
      resultSub.remove();
      errorSub.remove();
      endSub.remove();
    };
  }, []);

  const cancel = useCallback(() => {
    try {
      const web = webRecognitionRef.current;
      if (web?.abort) web.abort();
      else web?.stop();
      getNativeSpeechModule()?.stop();
    } catch {
      // Native module or browser speech may already have stopped.
    }
    webRecognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);

    if (Platform.OS === 'web') {
      const SpeechRecognition = getWebSpeechConstructor();
      if (!SpeechRecognition) {
        setError('Voice search is not available in this browser');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        webRecognitionRef.current = recognition;
        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const last = event.results[event.results.length - 1];
          const text = last?.[0]?.transcript?.trim();
          if (last?.isFinal && text) {
            onTranscriptRef.current(text);
          }
        };
        recognition.onerror = (event) => {
          if (event.error === 'aborted' || event.error === 'no-speech') {
            setIsListening(false);
            return;
          }
          setError(
            event.error === 'not-allowed'
              ? 'Microphone permission is needed for voice search'
              : 'Could not hear that. Try again.',
          );
          setIsListening(false);
        };
        recognition.onend = () => {
          setIsListening(false);
          webRecognitionRef.current = null;
        };
        setIsListening(true);
        recognition.start();
      } catch {
        setError('Voice search is not available on this device');
        setIsListening(false);
      }
      return;
    }

    const module = getNativeSpeechModule();
    if (!module) {
      setError('Voice search is not available on this device');
      return;
    }

    try {
      const permission = await module.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission is needed for voice search');
        return;
      }
      setIsListening(true);
      module.start({
        lang: 'en-IN',
        interimResults: false,
        continuous: false,
        addsPunctuation: false,
      });
    } catch {
      setError('Voice search is not available on this device');
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        const web = webRecognitionRef.current;
        if (web?.abort) web.abort();
        else web?.stop();
      } catch {
        // Ignore teardown errors.
      }
    };
  }, []);

  return {
    isListening,
    error,
    start,
    cancel,
  };
}
