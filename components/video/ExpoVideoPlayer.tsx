import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

interface ExpoVideoPlayerProps {
  source: VideoSource;
  loop?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  paused?: boolean;
  contentFit?: 'cover' | 'contain' | 'fill';
  surfaceType?: 'textureView' | 'surfaceView';
}

export function ExpoVideoPlayer({
  source,
  loop = false,
  muted = false,
  autoPlay = true,
  paused = false,
  contentFit = 'cover',
  surfaceType = 'textureView',
}: ExpoVideoPlayerProps) {
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

  return (
    <VideoView
      style={styles.video}
      player={player}
      contentFit={contentFit}
      nativeControls={false}
      surfaceType={surfaceType}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
