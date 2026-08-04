import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

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
}: ExpoVideoPlayerProps) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

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
    setReady(false);
    setFailed(false);

    const statusSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setReady(true);
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
          }
        } else {
          setFailed(true);
        }
      }
    });

    return () => {
      statusSub.remove();
    };
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
            setReady(false);
            setReloadToken((n) => n + 1);
            try {
              player.replay();
              player.play();
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
