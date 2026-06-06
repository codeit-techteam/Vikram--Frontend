import type { Order } from '@store/orderStore';
import type { OrderFilters } from '@components/orders/OrderFilterSheet';

const KNOWN_BRANDS = ['UltraTech', 'JSW', 'ACC', 'TATA', 'Jindal', 'Ambuja'];

function getOrderBrand(order: Order): string {
  for (const brand of KNOWN_BRANDS) {
    if (order.productName.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  for (const material of order.materials) {
    for (const brand of KNOWN_BRANDS) {
      if (material.name.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }
  }
  return order.productName.split(' ')[0] ?? '';
}

function getOrderCategory(order: Order): string {
  const name = order.productName.toLowerCase();
  if (name.includes('cement')) return 'cement';
  if (name.includes('tmt') || name.includes('steel') || name.includes('neosteel')) return 'steel';
  if (name.includes('aggregate') || name.includes('stone')) return 'aggregates';
  if (name.includes('sand')) return 'sand';
  if (name.includes('brick')) return 'bricks';
  return '';
}

export function filterOrders(orders: Order[], query: string, filters: OrderFilters): Order[] {
  const q = query.trim().toLowerCase();
  const now = new Date();

  return orders.filter((order) => {
    if (q) {
      const haystack = [
        order.productName,
        order.description,
        order.id,
        getOrderBrand(order),
        getOrderCategory(order),
        order.productGrade,
      ]
        .join(' ')
        .toLowerCase();
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
