import { api } from '@services/api';
import type { ApiResponse } from '@/types';
import type { InvoiceDetail, InvoicesPage, InvoicesQueryParams } from '@/types/invoice';
import {
  normalizeInvoiceDetail,
  normalizeInvoicesPage,
} from '@utils/invoiceAdapters';
import { fetchOrderInvoice, fetchOrderInvoicePdf } from '@services/orders.api';

const INVOICES_BASE = '/customer/invoices';

export async function fetchInvoices(
  params: InvoicesQueryParams = {},
): Promise<InvoicesPage> {
  const {
    page = 1,
    limit = 20,
    status,
    search,
    sortBy,
    sortOrder,
    fromDate,
    toDate,
    paymentStatus,
  } = params;

  const query = new URLSearchParams();
  query.set('page', String(page));
  query.set('limit', String(limit));
  if (status) query.set('status', status);
  if (search?.trim()) query.set('search', search.trim());
  if (sortBy) query.set('sortBy', sortBy);
  if (sortOrder) query.set('sortOrder', sortOrder);
  if (fromDate) query.set('fromDate', fromDate);
  if (toDate) query.set('toDate', toDate);
  if (paymentStatus) query.set('paymentStatus', paymentStatus);

  const { data } = await api.get<ApiResponse<unknown>>(
    `${INVOICES_BASE}?${query.toString()}`,
  );

  return normalizeInvoicesPage(data.data, page);
}

export async function fetchInvoiceByOrderId(orderId: string): Promise<InvoiceDetail> {
  const raw = await fetchOrderInvoice(orderId);
  return normalizeInvoiceDetail(raw);
}

export async function downloadInvoicePdfByOrderId(
  orderId: string,
): Promise<{ uri: string; filename: string }> {
  return fetchOrderInvoicePdf(orderId);
}
