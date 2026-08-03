import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  downloadInvoicePdfByOrderId,
  fetchInvoiceByOrderId,
  fetchInvoices,
} from '@services/invoices.api';
import { realtimeSocket } from '@services/realtime.socket';
import type {
  AccountInvoiceListItem,
  InvoiceListFilter,
  InvoiceSort,
  InvoicesPage,
} from '@/types/invoice';
import { isPaidPaymentStatus } from '@utils/invoiceAdapters';

export const INVOICES_QUERY_KEY = 'customer-invoices';
export const INVOICE_DETAIL_QUERY_KEY = 'invoice-detail';

function invoicesKey(search: string, apiStatus?: string, sort?: InvoiceSort) {
  return [INVOICES_QUERY_KEY, search, apiStatus ?? 'all', sort ?? 'newest'] as const;
}

function mapSort(sort: InvoiceSort): {
  sortBy: 'invoiceDate' | 'grandTotal';
  sortOrder: 'asc' | 'desc';
} {
  switch (sort) {
    case 'oldest':
      return { sortBy: 'invoiceDate', sortOrder: 'asc' };
    case 'highest_amount':
      return { sortBy: 'grandTotal', sortOrder: 'desc' };
    case 'lowest_amount':
      return { sortBy: 'grandTotal', sortOrder: 'asc' };
    case 'newest':
    default:
      return { sortBy: 'invoiceDate', sortOrder: 'desc' };
  }
}

function mapApiStatus(
  filter: InvoiceListFilter,
): 'PENDING' | 'GENERATED' | 'CANCELLED' | undefined {
  if (filter === 'cancelled') return 'CANCELLED';
  return undefined;
}

function dateBounds(filter: InvoiceListFilter): { fromDate?: string; toDate?: string } {
  const now = new Date();
  if (filter === 'last_30_days') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { fromDate: from.toISOString() };
  }
  if (filter === 'this_year') {
    return { fromDate: new Date(now.getFullYear(), 0, 1).toISOString() };
  }
  return {};
}

function applyClientFilters(
  items: AccountInvoiceListItem[],
  filter: InvoiceListFilter,
  search: string,
): AccountInvoiceListItem[] {
  let list = items;

  if (filter === 'gst') list = list.filter((i) => i.invoiceType === 'GST');
  if (filter === 'retail') list = list.filter((i) => i.invoiceType === 'RETAIL');
  if (filter === 'paid') list = list.filter((i) => isPaidPaymentStatus(i.paymentStatus));
  if (filter === 'pending') {
    list = list.filter(
      (i) =>
        i.status === 'PENDING' ||
        (!isPaidPaymentStatus(i.paymentStatus) && i.status !== 'CANCELLED'),
    );
  }
  if (filter === 'cancelled') list = list.filter((i) => i.status === 'CANCELLED');

  if (filter === 'last_30_days') {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    list = list.filter((i) => new Date(i.invoiceDate).getTime() >= cutoff);
  }
  if (filter === 'this_year') {
    const year = new Date().getFullYear();
    list = list.filter((i) => new Date(i.invoiceDate).getFullYear() === year);
  }

  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter((inv) => {
      const haystack = [
        inv.invoiceNumber,
        inv.orderNumber,
        inv.orderId,
        inv.customerName,
        inv.invoiceDate,
        ...inv.productNames,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return list;
}

export function useInvoices(
  search = '',
  filter: InvoiceListFilter = 'all',
  sort: InvoiceSort = 'newest',
) {
  const [socketConnected, setSocketConnected] = useState(realtimeSocket.isConnected());
  useEffect(() => realtimeSocket.onConnectionChange(setSocketConnected), []);

  const { sortBy, sortOrder } = mapSort(sort);
  const apiStatus = mapApiStatus(filter);
  const bounds = dateBounds(filter);

  const query = useInfiniteQuery({
    queryKey: [...invoicesKey(search, apiStatus, sort), filter, bounds.fromDate ?? ''],
    queryFn: async ({ pageParam }) => {
      const page = await fetchInvoices({
        page: (pageParam as number | undefined) ?? 1,
        limit: 20,
        status: apiStatus,
        search: search || undefined,
        sortBy,
        sortOrder,
        fromDate: bounds.fromDate,
        toDate: bounds.toDate,
      });
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: InvoicesPage) => lastPage.nextPage ?? undefined,
    staleTime: socketConnected ? 60_000 : 15_000,
  });

  const invoices = useMemo(() => {
    const fromQuery = query.data?.pages.flatMap((page) => page.items) ?? [];
    const seen = new Set<string>();
    const unique: AccountInvoiceListItem[] = [];
    for (const item of fromQuery) {
      const key = item.id || `${item.orderId}:${item.invoiceNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }
    return applyClientFilters(unique, filter, search);
  }, [query.data?.pages, filter, search]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  return {
    invoices,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    loadMore,
    refetch: query.refetch,
    total: query.data?.pages[0]?.total ?? invoices.length,
  };
}

export function useInvoiceDetail(orderId?: string) {
  return useQuery({
    queryKey: [INVOICE_DETAIL_QUERY_KEY, orderId],
    queryFn: () => fetchInvoiceByOrderId(orderId!),
    enabled: Boolean(orderId),
    staleTime: 60_000,
  });
}

export function useInvalidateInvoices() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
    void queryClient.invalidateQueries({ queryKey: [INVOICE_DETAIL_QUERY_KEY] });
  }, [queryClient]);
}

export async function shareInvoicePdf(orderId: string) {
  return downloadInvoicePdfByOrderId(orderId);
}
