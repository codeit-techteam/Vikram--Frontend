import { formatINR } from '@utils/formatCurrency';
import type { Order } from '@store/orderStore';

export interface InvoiceLineItem {
  id: string;
  name: string;
  spec: string;
  imageSearch: string;
  productId?: string;
  cartLineId?: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  issuedDate: string;
  dueDays: number;
  totalAmount: number;
  billedFrom: {
    name: string;
    address: string;
    gstin: string;
  };
  billedTo: {
    name: string;
    address: string;
    gstin: string;
  };
  items: InvoiceLineItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  timeline: { label: string; date: string; completed: boolean }[];
}

const DEFAULT_INVOICE: InvoiceData = {
  id: 'BJW-INV-88294',
  issuedDate: 'Oct 24, 2023',
  dueDays: 14,
  totalAmount: 144550,
  billedFrom: {
    name: 'Bajriwala Logistics',
    address: 'Industrial Hub, Sector 62, Gurgaon, HR - 122001',
    gstin: '06ABCDE1234F1Z5',
  },
  billedTo: {
    name: 'Prime Construction Ltd',
    address: 'Plot 44, Industrial Estate, Pune, MH - 411013',
    gstin: '27AAACR1234F1Z5',
  },
  items: [
    {
      id: 'inv1',
      name: 'Premium Steel TMT Bars',
      spec: 'FE 500D Grade • 12mm',
      imageSearch: 'tmt steel bars construction',
      qty: 200,
      unitPrice: 580,
      total: 116000,
    },
    {
      id: 'inv2',
      name: 'Galvanized Binding Wire',
      spec: '18 Gauge • 25kg Roll',
      imageSearch: 'binding wire roll',
      qty: 4,
      unitPrice: 1625,
      total: 6500,
    },
  ],
  subtotal: 122500,
  cgst: 11025,
  sgst: 11025,
  timeline: [
    { label: 'Order Placed', date: 'Oct 22, 2023 • 10:45 AM', completed: true },
    { label: 'Invoice Generated', date: 'Oct 24, 2023 • 02:30 PM', completed: true },
    { label: 'Payment Confirmed', date: 'Awaiting confirmation...', completed: false },
  ],
};

export function getInvoiceData(invoiceId: string, order?: Order): InvoiceData {
  if (!order) return { ...DEFAULT_INVOICE, id: invoiceId };

  const subtotal = order.subtotal;
  const cgst = order.gst / 2;
  const sgst = order.gst / 2;
  const lineItems =
    order.materials.length > 0
      ? order.materials.map((m) => ({
          id: m.id,
          name: m.name,
          spec: m.description,
          imageSearch: m.imageSearch,
          productId: m.productId,
          cartLineId: m.cartLineId,
          qty: 1,
          unitPrice: m.total,
          total: m.total,
        }))
      : order.items.map((item, idx) => ({
          id: `inv-${idx}`,
          name: item.name,
          spec: `${item.unit} • Qty ${item.quantity}`,
          imageSearch: item.imageSearch ?? item.image,
          productId: item.productId,
          cartLineId: item.id,
          qty: item.quantity,
          unitPrice: item.quantity >= item.bulkThreshold ? item.bulkPrice : item.unitPrice,
          total:
            item.quantity *
            (item.quantity >= item.bulkThreshold ? item.bulkPrice : item.unitPrice),
        }));

  return {
    id: invoiceId,
    issuedDate: order.createdAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    dueDays: 14,
    totalAmount: order.totalPayable,
    billedFrom: DEFAULT_INVOICE.billedFrom,
    billedTo: DEFAULT_INVOICE.billedTo,
    items: lineItems,
    subtotal,
    cgst,
    sgst,
    timeline: [
      {
        label: 'Order Placed',
        date: order.createdAt.toLocaleString('en-IN'),
        completed: true,
      },
      {
        label: 'Invoice Generated',
        date: new Date().toLocaleString('en-IN'),
        completed: true,
      },
      { label: 'Payment Confirmed', date: 'Awaiting confirmation...', completed: false },
    ],
  };
}

export function buildInvoiceHtml(invoice: InvoiceData): string {
  const rows = invoice.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}<br/><small>${item.spec}</small></td>
      <td>${item.qty}x</td>
      <td>${formatINR(item.unitPrice)}</td>
      <td>${formatINR(item.total)}</td>
    </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #1A1A1A; }
  h1 { color: #FEB623; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border-bottom: 1px solid #E0E0E0; padding: 8px; text-align: left; }
  .total { font-size: 20px; font-weight: bold; color: #FEB623; }
</style></head><body>
  <h1>Bajriwala Invoice</h1>
  <p><strong>${invoice.id}</strong> • Issued ${invoice.issuedDate}</p>
  <p>Billed From: ${invoice.billedFrom.name}<br/>${invoice.billedFrom.address}</p>
  <p>Billed To: ${invoice.billedTo.name}<br/>${invoice.billedTo.address}</p>
  <table>
    <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
    ${rows}
  </table>
  <p>Subtotal: ${formatINR(invoice.subtotal)}</p>
  <p>CGST (9%): ${formatINR(invoice.cgst)}</p>
  <p>SGST (9%): ${formatINR(invoice.sgst)}</p>
  <p class="total">Total: ${formatINR(invoice.totalAmount)}</p>
</body></html>`;
}
