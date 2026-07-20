import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  visible: boolean;
  onPlayPause: () => void;
  onMute: () => void;
  onSeek: (time: number) => void;
  onReplay: () => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const VideoControls = memo(function VideoControls({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  visible,
  onPlayPause,
  onMute,
  onSeek,
  onReplay,
  onClose,
}: VideoControlsProps) {
  if (!visible) return null;

  const atEnd = duration > 0 && currentTime >= duration - 0.5;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.iconButton} hitSlop={12}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.centerControls} pointerEvents="box-none">
        <Pressable onPress={atEnd ? onReplay : onPlayPause} style={styles.mainPlay}>
          <Ionicons
            name={atEnd ? 'refresh' : isPlaying ? 'pause' : 'play'}
            size={36}
            color="#1A1A1A"
            style={!atEnd && !isPlaying ? styles.playOffset : undefined}
          />
        </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={Math.max(duration, 0.01)}
          value={Math.min(currentTime, duration || 0)}
          onSlidingComplete={onSeek}
          minimumTrackTintColor="#FEB623"
          maximumTrackTintColor="rgba(255,255,255,0.35)"
          thumbTintColor="#FEB623"
        />

        <View style={styles.actionsRow}>
          <Pressable onPress={onPlayPause} style={styles.smallButton}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={onMute} style={styles.smallButton}>
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={22}
              color="#FFFFFF"
            />
          </Pressable>

          <Pressable onPress={onReplay} style={styles.smallButton}>
            <Ionicons name="refresh" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(254, 182, 35, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOffset: {
    marginLeft: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 28,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 4,
  },
  smallButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
