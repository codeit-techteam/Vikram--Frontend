import { Redirect } from 'expo-router';

import { useOrderStore } from '@store/orderStore';

export default function LatestInvoiceScreen() {
  const orders = useOrderStore((s) => s.orders);
  const latest = orders.find((o) => o.status === 'delivered' || o.invoiceId) ?? orders[0];

  if (!latest) {
    return <Redirect href="/account/invoices" />;
  }

  return (
    <Redirect
      href={{
        pathname: '/invoice/[invoiceId]',
        params: {
          invoiceId: latest.invoiceId || latest.id,
          orderId: latest.id,
        },
      }}
    />
  );
}
