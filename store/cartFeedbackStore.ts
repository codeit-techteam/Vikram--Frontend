import { create } from 'zustand';

import type { CartAddOutcome } from '@store/cartStore';

export interface CartFeedbackPayload {
  outcome: CartAddOutcome;
}

interface CartFeedbackState {
  feedback: CartFeedbackPayload | null;
  showFeedback: (payload: CartFeedbackPayload) => void;
  clearFeedback: () => void;
}

export const useCartFeedbackStore = create<CartFeedbackState>((set) => ({
  feedback: null,
  showFeedback: (payload) => set({ feedback: payload }),
  clearFeedback: () => set({ feedback: null }),
}));
