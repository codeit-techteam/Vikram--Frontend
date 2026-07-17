import { create } from 'zustand';

interface ReorderFeedbackState {
  toastMessage: string | null;
  unavailableSheetVisible: boolean;
  showToast: (message: string) => void;
  clearToast: () => void;
  showUnavailableSheet: () => void;
  hideUnavailableSheet: () => void;
}

export const useReorderFeedbackStore = create<ReorderFeedbackState>((set) => ({
  toastMessage: null,
  unavailableSheetVisible: false,
  showToast: (message) => set({ toastMessage: message }),
  clearToast: () => set({ toastMessage: null }),
  showUnavailableSheet: () => set({ unavailableSheetVisible: true }),
  hideUnavailableSheet: () => set({ unavailableSheetVisible: false }),
}));
