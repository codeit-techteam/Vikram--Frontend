import { Redirect } from 'expo-router';

/** Legacy route — loyalty lives under Account. */
export default function LoyaltyRedirect() {
  return <Redirect href="/account/loyalty" />;
}
