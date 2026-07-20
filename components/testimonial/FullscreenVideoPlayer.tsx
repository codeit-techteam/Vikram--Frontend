import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { VideoControls } from '@components/testimonial/VideoControls';
import type { TestimonialVideo } from '@constants/testimonialData';
import { useTranslation } from '@store/languageStore';

interface FullscreenVideoPlayerProps {
  item: TestimonialVideo;
  visible: boolean;
  onClose: () => void;
}

const CONTROLS_HIDE_MS = 3500;

export function FullscreenVideoPlayer({ item, visible, onClose }: FullscreenVideoPlayerProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsOpacity = useSharedValue(1);

  const player = useVideoPlayer(item.video, (instance) => {
    instance.loop = false;
    instance.muted = false;
    instance.timeUpdateEventInterval = 0.25;
  });

  const scheduleHideControls = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setShowControls(false);
      controlsOpacity.value = withTiming(0, { duration: 280 });
    }, CONTROLS_HIDE_MS);
  }, [controlsOpacity]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    scheduleHideControls();
  }, [controlsOpacity, scheduleHideControls]);

  useEffect(() => {
    if (!visible) return;

    setIsLoading(true);
    setHasError(false);
    setIsPlaying(true);
    setIsMuted(false);
    setCurrentTime(0);
    setDuration(0);
    revealControls();
    player.muted = false;
    player.currentTime = 0;
    player.play();
  }, [visible, item.id, player, revealControls]);

  useEffect(() => {
    if (!visible) {
      player.pause();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
  }, [visible, player]);

  useEventListener(player, 'playingChange', ({ isPlaying: playing }) => {
    setIsPlaying(playing);
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      setIsLoading(false);
      setDuration(player.duration);
    }
    if (status === 'error') {
      setHasError(true);
      setIsLoading(false);
    }
  });

  useEventListener(player, 'timeUpdate', ({ currentTime: time }) => {
    setCurrentTime(time);
    if (player.duration > 0) setDuration(player.duration);
  });

  useEventListener(player, 'playToEnd', () => {
    setIsPlaying(false);
    revealControls();
  });

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const handleClose = () => {
    player.pause();
    onClose();
  };

  const dismissGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationY > 72 && event.velocityY > 0) {
      runOnJS(handleClose)();
    }
  });

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    revealControls();
  };

  const handleMute = () => {
    const next = !isMuted;
    player.muted = next;
    setIsMuted(next);
    revealControls();
  };

  const handleSeek = (time: number) => {
    player.currentTime = time;
    setCurrentTime(time);
    revealControls();
  };

  const handleReplay = () => {
    player.currentTime = 0;
    player.play();
    setIsPlaying(true);
    revealControls();
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    player.replace(item.video);
    player.play();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <StatusBar style="light" />
      <GestureDetector gesture={dismissGesture}>
        <Pressable style={styles.container} onPress={revealControls}>
        <VideoView
          style={[styles.video, { width, height }]}
          player={player}
          contentFit="contain"
          nativeControls={false}
          surfaceType="textureView"
          allowsFullscreen={false}
        />

        {isLoading && !hasError ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FEB623" />
            <Text style={styles.loadingText}>{t('loadingTestimonial')}</Text>
          </View>
        ) : null}

        {hasError ? (
          <View style={styles.errorOverlay}>
            <Ionicons name="alert-circle-outline" size={48} color="#FEB623" />
            <Text style={styles.errorTitle}>{t('unableToPlayVideo')}</Text>
            <Text style={styles.errorSubtitle}>{item.customerName}</Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={18} color="#1A1A1A" />
              <Text style={styles.retryText}>{t('retry')}</Text>
            </Pressable>
            <Pressable style={styles.closeLink} onPress={handleClose}>
              <Text style={styles.closeLinkText}>{t('close')}</Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={[StyleSheet.absoluteFillObject, controlsStyle]} pointerEvents="box-none">
            <VideoControls
              isPlaying={isPlaying}
              isMuted={isMuted}
              currentTime={currentTime}
              duration={duration}
              visible={showControls && !isLoading}
              onPlayPause={handlePlayPause}
              onMute={handleMute}
              onSeek={handleSeek}
              onReplay={handleReplay}
              onClose={handleClose}
            />
          </Animated.View>
        )}

        <View style={styles.swipeHint} pointerEvents="none">
          <View style={styles.swipePill} />
        </View>
        </Pressable>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 14,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.88)',
    paddingHorizontal: 32,
    gap: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  retryButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEB623',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  closeLink: {
    marginTop: 12,
    padding: 8,
  },
  closeLinkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  swipeHint: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
  },
  swipePill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
