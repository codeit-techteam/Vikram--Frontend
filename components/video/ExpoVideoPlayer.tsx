import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

const LOAD_TIMEOUT_MS = 20_000;

function sourceUri(source: VideoSource): string | null {
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object' && 'uri' in source && source.uri) {
    return source.uri;
  }
  return null;
}

/** Drop image cache-busters only — keep signed query params. */
function stripCacheBuster(uri: string): string {
  try {
    const url = new URL(uri);
    url.searchParams.delete('v');
    url.searchParams.delete('updated');
    url.hash = '';
    const query = url.searchParams.toString();
    return query
      ? `${url.origin}${url.pathname}?${query}`
      : `${url.origin}${url.pathname}`;
  } catch {
    return uri
      .replace(/([?&])(v|updated)=\d+/g, '')
      .replace(/[?&]$/, '')
      .split('#')[0];
  }
}

function toPlayableVideoSource(source: VideoSource): VideoSource {
  if (typeof source === 'number' || source == null) return source;

  const asObject = (uri: string, rest?: Extract<VideoSource, object>) => {
    const clean = stripCacheBuster(uri);
    const path = clean.split('?')[0]?.toLowerCase() ?? clean;
    const progressive =
      /\.(mp4|m4v|mov)$/.test(path) || path.includes('/videos/');
    return {
      ...(rest && typeof rest === 'object' ? rest : {}),
      uri: clean,
      contentType: rest && 'contentType' in rest && rest.contentType
        ? rest.contentType
        : progressive
          ? 'progressive'
          : 'auto',
      useCaching:
        rest && 'useCaching' in rest && typeof rest.useCaching === 'boolean'
          ? rest.useCaching
          : true,
    } satisfies VideoSource;
  };

  if (typeof source === 'string') return asObject(source);
  if (typeof source === 'object' && 'uri' in source && source.uri) {
    return asObject(source.uri, source);
  }
  return source;
}

interface ExpoVideoPlayerProps {
  source: VideoSource;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  paused?: boolean;
  contentFit?: 'cover' | 'contain' | 'fill';
  surfaceType?: 'textureView' | 'surfaceView';
  /** Show system play/pause/seek/fullscreen controls (product gallery). */
  nativeControls?: boolean;
  /** Poster / thumbnail while buffering (R2 URL). */
  posterUrl?: string | null;
  /** Max silent retries after a playback error. */
  maxRetries?: number;
  style?: StyleProp<ViewStyle>;
  /** Fired when the player becomes ready (or fails after retries). */
  onReadyChange?: (ready: boolean) => void;
}

export function ExpoVideoPlayer({
  source,
  loop = false,
  muted = false,
  autoPlay = true,
  paused = false,
  contentFit = 'contain',
  surfaceType,
  nativeControls = false,
  posterUrl,
  maxRetries = 2,
  style,
  onReadyChange,
}: ExpoVideoPlayerProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [laidOut, setLaidOut] = useState(false);
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;
  const lastUriRef = useRef<string | null>(null);

  const resolvedSource = useMemo(() => toPlayableVideoSource(source), [source]);
  const resolvedUri = sourceUri(resolvedSource);
  // Android Modal / overlay playback is unreliable with SurfaceView.
  const resolvedSurface =
    surfaceType ?? (Platform.OS === 'android' ? 'textureView' : 'surfaceView');

  const markReady = (next: boolean) => {
    setReady(next);
    onReadyChangeRef.current?.(next);
  };

  const player = useVideoPlayer(resolvedSource, (instance) => {
    instance.loop = loop;
    instance.muted = muted;
    instance.audioMixingMode = 'auto';
  });

  useEffect(() => {
    player.loop = loop;
    player.muted = muted;
  }, [loop, muted, player]);

  useEffect(() => {
    const isFirstLoad = lastUriRef.current === null;
    const uriChanged = resolvedUri !== lastUriRef.current;
    lastUriRef.current = resolvedUri;

    // useVideoPlayer already loads the initial source. Replacing on mount
    // detaches the Android surface and leaves a black frame in Expo Go.
    if (isFirstLoad && reloadToken === 0) return;
    if (!uriChanged && reloadToken === 0) return;

    markReady(false);
    setFailed(false);
    try {
      player.replace(resolvedSource);
    } catch {
      /* replace can throw if player is released */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedUri, reloadToken, player]);

  useEffect(() => {
    if (paused) {
      player.pause();
      return;
    }
    if (!autoPlay || !laidOut) return;
    const timer = setTimeout(() => {
      try {
        player.play();
      } catch {
        /* ignore */
      }
    }, Platform.OS === 'android' ? 160 : 40);
    return () => clearTimeout(timer);
  }, [autoPlay, paused, player, laidOut, reloadToken, resolvedUri]);

  useEffect(() => {
    if (player.status === 'readyToPlay') {
      markReady(true);
    }

    const statusSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        markReady(true);
        setFailed(false);
      }
      if (payload.status === 'error') {
        if (retryCount < maxRetries) {
          setRetryCount((n) => n + 1);
          setReloadToken((n) => n + 1);
          return;
        }
        setFailed(true);
        markReady(false);
      }
    });

    const timeout = setTimeout(() => {
      if (player.status === 'readyToPlay') return;
      if (retryCount < maxRetries) {
        setRetryCount((n) => n + 1);
        setReloadToken((n) => n + 1);
      } else if (player.status === 'error' || player.status === 'idle') {
        setFailed(true);
        markReady(false);
      }
    }, LOAD_TIMEOUT_MS);

    return () => {
      statusSub.remove();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, retryCount, maxRetries, reloadToken]);

  if (failed) {
    return (
      <View style={[styles.container, style]} collapsable={false}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.fill} contentFit="cover" />
        ) : null}
        <Pressable
          style={styles.retryBtn}
          onPress={() => {
            setRetryCount(0);
            setFailed(false);
            markReady(false);
            setReloadToken((n) => n + 1);
          }}>
          <Text style={styles.retryText}>Retry video</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      collapsable={false}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 1 && height > 1) setLaidOut(true);
      }}>
      <VideoView
        style={styles.fill}
        player={player}
        contentFit={contentFit}
        nativeControls={nativeControls}
        allowsPictureInPicture={false}
        fullscreenOptions={{ enable: nativeControls }}
        surfaceType={resolvedSurface}
        onFirstFrameRender={() => {
          markReady(true);
          setFailed(false);
        }}
      />
      {!ready && (
        <View style={styles.skeleton} pointerEvents="none">
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : null}
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>Loading video…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  retryText: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
});
