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

const LOAD_TIMEOUT_MS = 25_000;

function resolveVideoSource(source: VideoSource): VideoSource {
  if (typeof source === 'string') {
    return source.split('?')[0]?.split('#')[0] || source;
  }
  if (source && typeof source === 'object' && 'uri' in source && source.uri) {
    const clean = source.uri.split('?')[0]?.split('#')[0] || source.uri;
    return { ...source, uri: clean };
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
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;

  const resolvedSource = useMemo(() => resolveVideoSource(source), [source]);
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
    markReady(false);
    setFailed(false);
    try {
      player.replace(resolvedSource);
    } catch {
      /* replace can throw if player is released */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSource, reloadToken]);

  useEffect(() => {
    if (paused) {
      player.pause();
      return;
    }
    if (!autoPlay) return;
    // Delay play until the view has laid out — avoids Android black-frame starts.
    const timer = setTimeout(() => {
      try {
        player.play();
      } catch {
        /* ignore */
      }
    }, Platform.OS === 'android' ? 120 : 0);
    return () => clearTimeout(timer);
  }, [autoPlay, paused, player, reloadToken, resolvedSource]);

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
      if (player.status !== 'readyToPlay') {
        // Keep trying visually if audio already works — don't force failed too early
        // when frames are delayed on Android TextureView.
        if (retryCount < maxRetries) {
          setRetryCount((n) => n + 1);
          setReloadToken((n) => n + 1);
        } else {
          setFailed(true);
          markReady(false);
        }
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
      <View style={[styles.container, style]}>
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
    <View style={[styles.container, style]}>
      <VideoView
        key={`video-${reloadToken}-${resolvedSurface}`}
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
    overflow: 'hidden',
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
