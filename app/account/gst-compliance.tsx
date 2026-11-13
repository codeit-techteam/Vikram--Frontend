import { Redirect, type Href } from 'expo-router';

/** Legacy route — GST compliance is managed via verified accounts list. */
export default function GstComplianceScreen() {
  return <Redirect href={'/account/gst-accounts' as Href} />;
}
