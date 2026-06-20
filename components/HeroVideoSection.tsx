import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';

import { getCategoryIdForProduct, getProductById } from '@constants/catalogData';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CEMENT_PRODUCT_ID = 'c1';

export default function HeroVideoSection() {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isFocused]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShopNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const product = getProductById(CEMENT_PRODUCT_ID);
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: CEMENT_PRODUCT_ID,
        categoryId: getCategoryIdForProduct(CEMENT_PRODUCT_ID) ?? '',
        categoryName: product?.category ?? 'Cement',
        productName: product?.detailName ?? product?.name ?? 'UltraTech Premium PPC Cement',
      },
    } as Href);
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('../assets/videos/delivery-hero.mp4')}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted={isMuted}
        useNativeControls={false}
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
        <View style={styles.badge}>
          <Ionicons name="flash" size={12} color="#1A1A1A" />
          <Text style={styles.badgeText}>2-Hour Delivery</Text>
        </View>
      </View>

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

      <View style={styles.bottomContent}>
        <Text style={styles.title}>
          Materials Delivered{'\n'}Right to Your Site
        </Text>
        <Text style={styles.subtitle}>
          Real-time tracking, verified drivers, zero delays.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleShopNow}
          activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - 32,
    height: 240,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
