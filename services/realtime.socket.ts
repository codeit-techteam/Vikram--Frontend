import { io, type Socket } from 'socket.io-client';

import { storage } from '@lib/storage';
import { AUTH_TOKEN_KEY } from '@services/api';
import { resolveSocketOrigin } from '@utils/resolveSocketUrl';

/** Canonical realtime event (matches backend). */
export const ORDER_UPDATED_EVENT = 'order.updated';
/** Legacy alias — still listened for safety. */
export const ORDER_STATUS_UPDATED_EVENT_LEGACY = 'OrderStatusUpdated';

export type OrderStatusUpdatedPayload = {
  orderId: string;
  orderNumber?: string;
  status: string;
  statusLabel: string;
  oldStatus?: string | null;
  updatedAt: string;
  version?: number;
  hubId?: string | null;
  customerId?: string;
  driverId?: string | null;
  eta?: string | null;
  expectedDeliveryAt?: string | null;
  trackingStatus?: string | null;
  driver?: {
    id?: string;
    name: string;
    phone?: string | null;
  } | null;
  vehicle?: {
    id?: string;
    registration: string;
    type?: string | null;
  } | null;
  driverReachedAt?: string | null;
  deliveryOtpGenerated?: boolean;
  deliveryOtpVerified?: boolean;
  timeline?: Array<{
    id: string;
    status: string;
    statusLabel: string;
    message: string;
    createdAt: string;
  }>;
};

type StatusListener = (payload: OrderStatusUpdatedPayload) => void;
type ReconnectListener = () => void;

class RealtimeSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private statusListeners = new Set<StatusListener>();
  private connectedListeners = new Set<(connected: boolean) => void>();
  private reconnectListeners = new Set<ReconnectListener>();
  private hadConnected = false;

  connect(accessToken: string): void {
    if (!accessToken) return;

    if (this.socket && this.token === accessToken && this.socket.connected) {
      return;
    }

    // Same token but disconnected — let socket.io reconnect; just refresh auth.
    if (this.socket && this.token === accessToken) {
      this.socket.auth = { token: accessToken };
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return;
    }

    this.disconnect();
    this.token = accessToken;

    const origin = resolveSocketOrigin();
    if (__DEV__) {
      console.log(`[realtime] connecting → ${origin}/realtime`);
    }

    this.socket = io(`${origin}/realtime`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      timeout: 15000,
      autoConnect: true,
      forceNew: true,
    });

    this.bindSocketHandlers(this.socket);
  }

  /** Refresh auth token used on reconnect (after HTTP token refresh). */
  updateToken(accessToken: string): void {
    if (!accessToken) return;
    this.token = accessToken;
    if (this.socket) {
      this.socket.auth = { token: accessToken };
      if (!this.socket.connected) {
        this.socket.connect();
      }
    } else {
      this.connect(accessToken);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.hadConnected = false;
    this.emitConnected(false);
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  onOrderStatusUpdated(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectedListeners.add(listener);
    listener(this.isConnected());
    return () => {
      this.connectedListeners.delete(listener);
    };
  }

  onReconnect(listener: ReconnectListener): () => void {
    this.reconnectListeners.add(listener);
    return () => {
      this.reconnectListeners.delete(listener);
    };
  }

  subscribeOrder(orderId: string): void {
    this.socket?.emit('subscribeOrder', { orderId });
  }

  unsubscribeOrder(orderId: string): void {
    this.socket?.emit('unsubscribeOrder', { orderId });
  }

  private bindSocketHandlers(socket: Socket): void {
    socket.on('connect', () => {
      if (__DEV__) {
        console.log('[realtime] connected', socket.id);
      }
      const wasReconnect = this.hadConnected;
      this.hadConnected = true;
      this.emitConnected(true);
      if (wasReconnect) {
        if (__DEV__) {
          console.log('[realtime] reconnected — syncing orders');
        }
        this.reconnectListeners.forEach((listener) => {
          try {
            listener();
          } catch {
            /* ignore */
          }
        });
      }
    });

    socket.on('disconnect', (reason) => {
      if (__DEV__) {
        console.log('[realtime] disconnected', reason);
      }
      this.emitConnected(false);
    });

    socket.on('connect_error', async (err) => {
      if (__DEV__) {
        console.warn('[realtime] connect_error', err.message);
      }
      this.emitConnected(false);

      // Prefer freshest token from storage on auth failures.
      const fresh = await storage.getItem(AUTH_TOKEN_KEY);
      if (fresh && fresh !== this.token && this.socket) {
        this.token = fresh;
        this.socket.auth = { token: fresh };
      }
    });

    const onPayload = (payload: OrderStatusUpdatedPayload) => {
      if (__DEV__) {
        console.log(
          '[realtime] Customer Event Received order.updated',
          payload.orderId,
          payload.status,
          payload.statusLabel,
          payload.updatedAt,
        );
      }
      this.statusListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          if (__DEV__) {
            console.warn('[realtime] listener error', error);
          }
        }
      });
    };

    socket.on(ORDER_UPDATED_EVENT, onPayload);
    socket.on(ORDER_STATUS_UPDATED_EVENT_LEGACY, onPayload);
  }

  private emitConnected(connected: boolean): void {
    this.connectedListeners.forEach((listener) => listener(connected));
  }
}

export const realtimeSocket = new RealtimeSocketManager();
