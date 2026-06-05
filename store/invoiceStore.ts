import { create } from 'zustand';

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface AccountInvoice {
  id: string;
  date: string;
  site: string;
  status: InvoiceStatus;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
}

const DEFAULT_INVOICES: AccountInvoice[] = [
  {
    id: 'INV-2023-98231',
    date: 'Oct 24, 2023',
    site: 'Skyline Tower',
    status: 'paid',
    total: 145000,
    cgst: 13050,
    sgst: 13050,
    igst: 0,
  },
  {
    id: 'INV-2023-98244',
    date: 'Oct 26, 2023',
    site: 'Omkar Enclave',
    status: 'pending',
    total: 312400,
    cgst: 28116,
    sgst: 28116,
    igst: 0,
  },
  {
    id: 'INV-2023-98251',
    date: 'Oct 28, 2023',
    site: 'Green Valley PH-II',
    status: 'overdue',
    total: 89200,
    cgst: 0,
    sgst: 0,
    igst: 16056,
  },
];

export type InvoiceFilter = 'all' | 'unpaid' | InvoiceStatus;

interface InvoiceState {
  invoices: AccountInvoice[];
  filter: InvoiceFilter;
  setFilter: (filter: InvoiceFilter) => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: DEFAULT_INVOICES,
  filter: 'all',
  setFilter: (filter) => set({ filter }),
}));
