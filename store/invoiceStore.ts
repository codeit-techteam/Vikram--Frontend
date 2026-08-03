import { create } from 'zustand';

/**
 * UI-only filter preference for the Invoices screen.
 * Invoice records themselves come from GET /customer/invoices (React Query).
 */
export type InvoiceFilter = 'all' | 'unpaid' | 'paid' | 'overdue';

interface InvoiceState {
  filter: InvoiceFilter;
  setFilter: (filter: InvoiceFilter) => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
