import { useCallback, useRef, useState } from 'react';
import { File } from 'expo-file-system';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';

import {
  cancelNativeRecognition,
  speechMode,
  SpeechCaptureError,
  startNativeRecognition,
  stopNativeRecognition,
  type SpeechMode,
} from '@services/speech/speechCapture';

export interface SpeechUtterance {
  transcript?: string;
  audioUri?: string;
  mimeType?: string;
  filename?: string;
}

const RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

function deleteRecording(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The cache file is discarded by the OS if deletion fails.
  }
}

export function useSpeechCapture() {
  const mode: SpeechMode = speechMode();
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [partial, setPartial] = useState('');
  const [level, setLevel] = useState(0);
  const [active, setActive] = useState(false);
  const modeRef = useRef(mode);
  const recordingRef = useRef(false);
  modeRef.current = mode;

  const cancel = useCallback(() => {
    cancelNativeRecognition();
    if (recordingRef.current) {
      recordingRef.current = false;
      void recorder.stop().catch(() => undefined);
      deleteRecording(recorder.uri);
    }
    setActive(false);
    setPartial('');
    setLevel(0);
  }, [recorder]);

  const start = useCallback(
    async (lang: string) => {
      setPartial('');
      setLevel(0);
      if (modeRef.current === 'native') {
        setActive(true);
        return;
      }
      if (modeRef.current === 'unavailable') {
        throw new SpeechCaptureError('unavailable', 'Voice search is not available on this device.');
      }

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new SpeechCaptureError(
          'permission',
          'Microphone access is needed so Bajriwala can hear your search.',
        );
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingRef.current = true;
      setActive(true);
      void lang;
    },
    [recorder],
  );

  const beginNative = useCallback(
    (lang: string) =>
      startNativeRecognition({
        lang,
        onPartial: setPartial,
        onLevel: setLevel,
      }),
    [],
  );

  const stop = useCallback(async (): Promise<SpeechUtterance> => {
    if (modeRef.current === 'native') {
      stopNativeRecognition();
      setActive(false);
      return {};
    }

    if (!recordingRef.current) {
      setActive(false);
      return {};
    }
    recordingRef.current = false;
    await recorder.stop();
    setActive(false);
    const uri = recorder.uri;
    if (!uri) {
      throw new SpeechCaptureError('no-speech', 'No speech detected. Please try again.');
    }
    return {
      audioUri: uri,
      mimeType: 'audio/m4a',
      filename: 'bajriwala-voice.m4a',
    };
  }, [recorder]);

  const readLevel = useCallback(() => {
    if (!recordingRef.current) return;
    const metering = recorder.getStatus().metering;
    if (typeof metering !== 'number') return;
    setLevel(Math.max(0, Math.min(1, (metering + 50) / 50)));
  }, [recorder]);

  return {
    mode,
    partial,
    level,
    active,
    start,
    beginNative,
    stop,
    cancel,
    readLevel,
    deleteRecording,
  };
}
