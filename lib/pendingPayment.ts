import { storage } from '@lib/storage';

const PENDING_PAYMENT_KEY = 'bajriwala_pending_razorpay';

export type PendingPaymentRecord = {
  internalOrderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  createdAt: string;
};

export async function savePendingPayment(record: PendingPaymentRecord): Promise<void> {
  await storage.setObject(PENDING_PAYMENT_KEY, record);
}

export async function getPendingPayment(): Promise<PendingPaymentRecord | null> {
  return storage.getObject<PendingPaymentRecord>(PENDING_PAYMENT_KEY);
}

export async function clearPendingPayment(): Promise<void> {
  await storage.removeItem(PENDING_PAYMENT_KEY);
}
