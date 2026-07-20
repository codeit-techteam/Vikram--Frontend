import { Asset } from 'expo-asset';

const assetUriCache = new Map<number, string>();

/** Resolve a bundled `require()` video module to a local file URI. */
export async function resolveVideoAssetUri(videoModule: number): Promise<string> {
  const cached = assetUriCache.get(videoModule);
  if (cached) return cached;

  const asset = Asset.fromModule(videoModule);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  const uri = asset.localUri ?? asset.uri;
  assetUriCache.set(videoModule, uri);
  return uri;
}
