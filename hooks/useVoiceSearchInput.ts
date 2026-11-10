import { openVoiceAssistant, voiceSheetRef } from '@components/VoiceAssistantSheet';

/** Search-screen microphone opens the same voice sheet as the home mic. */
export function useVoiceSearchInput(_onTranscript: (text: string) => void) {
  return {
    isListening: false,
    error: null as string | null,
    start: () => {
      openVoiceAssistant();
    },
    cancel: () => {
      voiceSheetRef.current?.dismiss();
    },
  };
}
