export interface WalletRefund {
  id: string;
  title: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
}

/** Mock wallet state — frontend only. */
export const MOCK_WALLET = {
  balance: 0,
  currency: 'INR' as const,
  refunds: [
    {
      id: 'wr1',
      title: 'Order #BW-10482 refund',
      date: '12 Jul 2026',
      amount: 450,
      status: 'completed' as const,
    },
    {
      id: 'wr2',
      title: 'Order #BW-10391 refund',
      date: '28 Jun 2026',
      amount: 1200,
      status: 'completed' as const,
    },
    {
      id: 'wr3',
      title: 'Partial refund — damaged bags',
      date: '15 Jun 2026',
      amount: 275,
      status: 'pending' as const,
    },
  ] satisfies WalletRefund[],
};
