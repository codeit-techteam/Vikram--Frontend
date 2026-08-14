import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeIsFocused } from '@hooks/useSafeIsFocused';

import { ExpoVideoPlayer } from '@components/video/ExpoVideoPlayer';
import type { CmsBanner } from '@/types/cms';
import { resolveCmsVideoSource } from '@utils/cmsMedia';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface VideoBannerProps {
  banner?: CmsBanner | null;
  onShopNow?: () => void;
}

export function VideoBanner({ banner, onShopNow }: VideoBannerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const isFocused = useSafeIsFocused();
  const [paused, setPaused] = useState(!isFocused);

  useEffect(() => {
    setPaused(!isFocused);
  }, [isFocused]);

  if (!banner?.videoUrl) return null;

  const videoSource = resolveCmsVideoSource(banner.videoUrl);
  if (!videoSource) return null;

  const toggleMute = () => {
    setIsMuted((current) => !current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShopNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onShopNow?.();
  };

  const badge = banner.badge ?? '';
  const title = banner.title;
  const subtitle = banner.subtitle ?? '';
  const buttonText = banner.buttonText ?? '';

  return (
    <View style={styles.container}>
      <ExpoVideoPlayer
        source={videoSource}
        loop
        muted={isMuted}
        autoPlay
        paused={paused}
        contentFit="cover"
        onReadyChange={setPlayerReady}
      />

      <LinearGradient
        colors={[
          'rgba(0,0,0,0.25)',
          'rgba(0,0,0,0.0)',
          'rgba(0,0,0,0.0)',
          'rgba(0,0,0,0.75)',
        ]}
        locations={[0, 0.18, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.topContent}>
        {badge ? (
          <View style={styles.badge}>
            <Ionicons name="flash" size={12} color="#1A1A1A" />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>

      {playerReady ? (
        <TouchableOpacity
          onPress={toggleMute}
          style={styles.muteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color="#fff"
          />
        </TouchableOpacity>
      ) : null}

      <View style={styles.bottomContent}>
        <Text style={styles.title}>{title.replace(/\\n/g, '\n')}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        {buttonText ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleShopNow}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{buttonText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

/** @deprecated Use named export `VideoBanner` */
export default VideoBanner;

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 32,
    height: 240,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  topContent: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEB623',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  muteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 14,
    lineHeight: 18,
  },
  primaryBtn: {
    backgroundColor: '#FEB623',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
