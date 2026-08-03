import type { AccountInvoiceListItem } from '@/types/invoice';
import { formatINR } from '@utils/formatCurrency';
import { formatInvoiceDate, paymentStatusLabel } from '@utils/invoiceAdapters';

export function buildAccountInvoiceHtml(invoice: AccountInvoiceListItem): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" />
<style>body{font-family:Arial,sans-serif;margin:24px}h1{color:#FEB623}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px}</style>
</head>
<body>
  <h1>Invoice #${invoice.invoiceNumber}</h1>
  <p>Order: ${invoice.orderNumber}</p>
  <p>Date: ${formatInvoiceDate(invoice.invoiceDate)} | Customer: ${invoice.customerName}</p>
  <p>Type: ${invoice.invoiceType === 'GST' ? 'GST Invoice' : 'Retail Invoice'}</p>
  <p>Status: ${paymentStatusLabel(invoice.paymentStatus)}</p>
  <table>
    <tr><th>Total</th></tr>
    <tr>
      <td><strong>${formatINR(invoice.grandTotal, false)}</strong></td>
    </tr>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#666">Bajriwala — Invoice</p>
</body>
</html>`;
}
