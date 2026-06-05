import type { Order } from '@store/orderStore';
import type { OrderFilters } from '@components/orders/OrderFilterSheet';

export function filterOrders(orders: Order[], query: string, filters: OrderFilters): Order[] {
  const q = query.trim().toLowerCase();
  const now = new Date();

  return orders.filter((order) => {
    if (q) {
      const haystack = `${order.productName} ${order.description} ${order.id}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    if (filters.status === 'active') {
      if (order.status === 'delivered' || order.status === 'cancelled') return false;
    } else if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }

    if (filters.date !== 'all') {
      const created = order.createdAt;
      const diffDays = (now.getTime() - created.getTime()) / 86400000;
      if (filters.date === 'today' && diffDays > 1) return false;
      if (filters.date === 'week' && diffDays > 7) return false;
      if (filters.date === 'month' && diffDays > 30) return false;
    }

    return true;
  });
}
