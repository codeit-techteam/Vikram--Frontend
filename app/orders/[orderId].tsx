import { Redirect, useLocalSearchParams } from 'expo-router';

export default function OrderRedirectScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <Redirect href={`/orders/view/${orderId}`} />;
}
