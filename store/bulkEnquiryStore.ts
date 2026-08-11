import { create } from 'zustand';

import {
  bulkApi,
  type BulkEnquiry,
  type CreateBulkEnquiryPayload,
} from '@services/bulk.api';

interface BulkEnquiryState {
  enquiries: BulkEnquiry[];
  lastSubmitted: BulkEnquiry | null;
  selectedEnquiry: BulkEnquiry | null;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  submitEnquiry: (payload: CreateBulkEnquiryPayload) => Promise<BulkEnquiry>;
  loadEnquiries: (params?: { page?: number; limit?: number }) => Promise<void>;
  loadEnquiryById: (id: string) => Promise<BulkEnquiry>;
  cancelEnquiry: (id: string) => Promise<BulkEnquiry>;
  reset: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const useBulkEnquiryStore = create<BulkEnquiryState>((set) => ({
  enquiries: [],
  lastSubmitted: null,
  selectedEnquiry: null,
  isSubmitting: false,
  isLoading: false,
  error: null,

  submitEnquiry: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const created = await bulkApi.create(payload);
      set((state) => ({
        enquiries: [
          created,
          ...state.enquiries.filter((e) => e.id !== created.id),
        ],
        lastSubmitted: created,
        isSubmitting: false,
      }));
      return created;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to submit enquiry');
      set({ isSubmitting: false, error: message });
      throw new Error(message);
    }
  },

  loadEnquiries: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await bulkApi.list(params);
      set({ enquiries: result.items ?? [], isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load enquiries'),
      });
    }
  },

  loadEnquiryById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const enquiry = await bulkApi.getById(id);
      set((state) => ({
        selectedEnquiry: enquiry,
        enquiries: state.enquiries.some((e) => e.id === enquiry.id)
          ? state.enquiries.map((e) => (e.id === enquiry.id ? enquiry : e))
          : [enquiry, ...state.enquiries],
        isLoading: false,
      }));
      return enquiry;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to load enquiry');
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  cancelEnquiry: async (id) => {
    try {
      const updated = await bulkApi.cancel(id);
      set((state) => ({
        enquiries: state.enquiries.map((e) => (e.id === id ? updated : e)),
        selectedEnquiry:
          state.selectedEnquiry?.id === id ? updated : state.selectedEnquiry,
        lastSubmitted:
          state.lastSubmitted?.id === id ? updated : state.lastSubmitted,
      }));
      return updated;
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to cancel enquiry');
      set({ error: message });
      throw new Error(message);
    }
  },

  reset: () =>
    set({
      enquiries: [],
      lastSubmitted: null,
      selectedEnquiry: null,
      isSubmitting: false,
      isLoading: false,
      error: null,
    }),
}));

export type { BulkEnquiry };
