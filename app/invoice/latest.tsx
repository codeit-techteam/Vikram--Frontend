import { Redirect } from 'expo-router';

import { useOrderStore } from '@store/orderStore';

export default function LatestInvoiceScreen() {
  const orders = useOrderStore((s) => s.orders);
  const invoiceId = orders[0]?.invoiceId ?? 'BJW-INV-88294';
  return <Redirect href={`/invoice/${invoiceId}`} />;
}
