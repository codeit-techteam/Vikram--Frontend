import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

const LOAD_TIMEOUT_MS = 12_000;

interface ExpoVideoPlayerProps {
  source: VideoSource;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  paused?: boolean;
  contentFit?: 'cover' | 'contain' | 'fill';
  surfaceType?: 'textureView' | 'surfaceView';
  /** Poster / thumbnail while buffering (R2 URL). */
  posterUrl?: string | null;
  /** Max silent retries after a playback error. */
  maxRetries?: number;
  /** Fired when the player becomes ready (or fails after retries). */
  onReadyChange?: (ready: boolean) => void;
}

export function ExpoVideoPlayer({
  source,
  loop = false,
  muted = false,
  autoPlay = true,
  paused = false,
  contentFit = 'cover',
  surfaceType = 'textureView',
  posterUrl,
  maxRetries = 2,
  onReadyChange,
}: ExpoVideoPlayerProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const onReadyChangeRef = useRef(onReadyChange);
  onReadyChangeRef.current = onReadyChange;

  const markReady = (next: boolean) => {
    setReady(next);
    onReadyChangeRef.current?.(next);
  };

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = loop;
    instance.muted = muted;
    if (autoPlay && !paused) {
      instance.play();
    }
  });

  useEffect(() => {
    player.loop = loop;
    player.muted = muted;
  }, [loop, muted, player]);

  useEffect(() => {
    if (paused) {
      player.pause();
    } else if (autoPlay) {
      player.play();
    }
  }, [autoPlay, paused, player]);

  useEffect(() => {
    markReady(false);
    setFailed(false);

    // Sync immediately — readyToPlay can fire before the listener attaches
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
          try {
            player.replay();
            if (autoPlay && !paused) player.play();
          } catch {
            setFailed(true);
            markReady(false);
          }
        } else {
          setFailed(true);
          markReady(false);
        }
      }
    });

    const timeout = setTimeout(() => {
      if (player.status !== 'readyToPlay') {
        setFailed(true);
        markReady(false);
      }
    }, LOAD_TIMEOUT_MS);

    return () => {
      statusSub.remove();
      clearTimeout(timeout);
    };
    // reloadToken intentionally retriggers the subscription after retries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, retryCount, maxRetries, autoPlay, paused, reloadToken]);

  if (failed) {
    return (
      <View style={styles.fallback}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.video} contentFit="cover" />
        ) : null}
        <Pressable
          style={styles.retryBtn}
          onPress={() => {
            setRetryCount(0);
            setFailed(false);
            markReady(false);
            setReloadToken((n) => n + 1);
            try {
              player.replace(source);
              if (autoPlay && !paused) player.play();
            } catch {
              setFailed(true);
            }
          }}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.video}>
      {!ready && (
        <View style={styles.skeleton}>
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
          ) : null}
          <ActivityIndicator color="#fff" />
        </View>
      )}
      <VideoView
        key={reloadToken}
        style={styles.video}
        player={player}
        contentFit={contentFit}
        nativeControls={false}
        surfaceType={surfaceType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  retryBtn: {
    position: 'absolute',
    bottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  retryText: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
});
