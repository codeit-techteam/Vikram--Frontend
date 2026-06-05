import { AppHeader } from '@components/AppHeader';

interface OrdersScreenHeaderProps {
  onMenuPress: () => void;
}

export function OrdersScreenHeader({ onMenuPress }: OrdersScreenHeaderProps) {
  return <AppHeader onMenuPress={onMenuPress} />;
}
