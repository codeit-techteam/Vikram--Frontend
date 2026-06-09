import type { AccountInvoice } from '@store/invoiceStore';
import { formatINR } from '@utils/formatCurrency';

export function buildAccountInvoiceHtml(invoice: AccountInvoice): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" />
<style>body{font-family:Arial,sans-serif;margin:24px}h1{color:#FEB623}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px}</style>
</head>
<body>
  <h1>${invoice.id}</h1>
  <p>Date: ${invoice.date} | Site: ${invoice.site}</p>
  <p>Status: ${invoice.status.toUpperCase()}</p>
  <table>
    <tr><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th></tr>
    <tr>
      <td>${formatINR(invoice.cgst, false)}</td>
      <td>${formatINR(invoice.sgst, false)}</td>
      <td>${formatINR(invoice.igst, false)}</td>
      <td><strong>${formatINR(invoice.total, false)}</strong></td>
    </tr>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#666">Bajriwala — GST Compliant Invoice</p>
</body>
</html>`;
}
