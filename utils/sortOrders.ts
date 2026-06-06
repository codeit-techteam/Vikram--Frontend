import type { Order } from '@store/orderStore';

export type OrderSortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc';

export function sortOrders(orders: Order[], sort: OrderSortOption): Order[] {
  const copy = [...orders];

  switch (sort) {
    case 'oldest':
      return copy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    case 'price_asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'name_asc':
      return copy.sort((a, b) => a.productName.localeCompare(b.productName));
    case 'newest':
    default:
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
