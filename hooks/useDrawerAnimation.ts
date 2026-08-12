import { useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;
const OVERLAY_MAX = 0.48;
const CONTENT_PARALLAX = 0.12;
const CONTENT_SCALE_MIN = 0.94;

/** Soft, iOS-like open — slight overshoot then settle. */
const OPEN_SPRING = {
  damping: 26,
  stiffness: 260,
  mass: 0.85,
  overshootClamping: false,
  restDisplacementThreshold: 0.2,
  restSpeedThreshold: 0.2,
} as const;

/** Snappy close without bounce. */
const CLOSE_SPRING = {
  damping: 28,
  stiffness: 320,
  mass: 0.75,
  overshootClamping: true,
  restDisplacementThreshold: 0.2,
  restSpeedThreshold: 0.2,
} as const;

const CONTENT_OPEN_SPRING = {
  damping: 24,
  stiffness: 220,
  mass: 0.9,
} as const;

const CONTENT_CLOSE_SPRING = {
  damping: 26,
  stiffness: 280,
  mass: 0.8,
  overshootClamping: true,
} as const;

const ICON_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.7,
} as const;

const OVERLAY_OPEN = {
  duration: 320,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

const OVERLAY_CLOSE = {
  duration: 240,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
} as const;

export const drawerPanelStyle = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 28,
  },
});

function triggerOpenHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function triggerCloseHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function useDrawerAnimation(
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void,
  swipeEnabled = true,
) {
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const overlayOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(0);
  const contentScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const drawerProgress = useSharedValue(0);
  const isOpenShared = useSharedValue(false);
  const drawerSwipeEnabled = useSharedValue(swipeEnabled);

  useEffect(() => {
    drawerSwipeEnabled.value = swipeEnabled;
  }, [drawerSwipeEnabled, swipeEnabled]);

  const animateOpen = useCallback(() => {
    translateX.value = withSpring(0, OPEN_SPRING);
    overlayOpacity.value = withTiming(OVERLAY_MAX, OVERLAY_OPEN);
    contentTranslate.value = withSpring(DRAWER_WIDTH * CONTENT_PARALLAX, CONTENT_OPEN_SPRING);
    contentScale.value = withSpring(CONTENT_SCALE_MIN, CONTENT_OPEN_SPRING);
    iconRotation.value = withSpring(1, ICON_SPRING);
    drawerProgress.value = withTiming(1, {
      duration: 340,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [contentScale, contentTranslate, drawerProgress, iconRotation, overlayOpacity, translateX]);

  const animateClosed = useCallback(() => {
    translateX.value = withSpring(-DRAWER_WIDTH, CLOSE_SPRING);
    overlayOpacity.value = withTiming(0, OVERLAY_CLOSE);
    contentTranslate.value = withSpring(0, CONTENT_CLOSE_SPRING);
    contentScale.value = withSpring(1, CONTENT_CLOSE_SPRING);
    iconRotation.value = withSpring(0, ICON_SPRING);
    drawerProgress.value = withTiming(0, {
      duration: 260,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [contentScale, contentTranslate, drawerProgress, iconRotation, overlayOpacity, translateX]);

  const openDrawer = useCallback(() => {
    triggerOpenHaptic();
    onOpen();
  }, [onOpen]);

  const closeDrawer = useCallback(() => {
    triggerCloseHaptic();
    onClose();
  }, [onClose]);

  const snapOpen = useCallback(() => {
    animateOpen();
  }, [animateOpen]);

  const snapClosed = useCallback(() => {
    animateClosed();
  }, [animateClosed]);

  useEffect(() => {
    isOpenShared.value = isOpen;
    if (isOpen) {
      animateOpen();
    } else {
      animateClosed();
    }
  }, [isOpen, isOpenShared, animateOpen, animateClosed]);

  // Edge-only open swipe (≤16px). Keeps hamburger / header buttons tappable.
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onTouchesDown((event, state) => {
      'worklet';
      if (!drawerSwipeEnabled.value) {
        state.fail();
        return;
      }
      if (isOpenShared.value) return;
      const touch = event.allTouches[0];
      // Only claim the far-left system edge — not the 48dp menu button.
      if (touch && touch.x > 16) {
        state.fail();
      }
    })
    .onUpdate((e) => {
      'worklet';
      if (!isOpenShared.value) {
        if (e.translationX > 0 && e.x < 30) {
          const progress = Math.min(1, e.translationX / DRAWER_WIDTH);
          // Ease the finger-follow so it feels weighted, not 1:1 rubbery.
          const eased = interpolate(progress, [0, 1], [0, 1], Extrapolation.CLAMP);
          translateX.value = -DRAWER_WIDTH + eased * DRAWER_WIDTH;
          overlayOpacity.value = eased * OVERLAY_MAX;
          contentTranslate.value = eased * DRAWER_WIDTH * CONTENT_PARALLAX;
          contentScale.value = 1 - eased * (1 - CONTENT_SCALE_MIN);
          drawerProgress.value = eased;
        }
      } else if (e.translationX < 0) {
        const progress = Math.min(1, Math.abs(e.translationX) / DRAWER_WIDTH);
        translateX.value = Math.max(-DRAWER_WIDTH, e.translationX);
        overlayOpacity.value = OVERLAY_MAX * (1 - progress);
        contentTranslate.value = DRAWER_WIDTH * CONTENT_PARALLAX * (1 - progress);
        contentScale.value = CONTENT_SCALE_MIN + progress * (1 - CONTENT_SCALE_MIN);
        drawerProgress.value = 1 - progress;
      }
    })
    .onEnd((e) => {
      'worklet';
      const velocityX = e.velocityX;
      const flingOpen = velocityX > 700;
      const flingClose = velocityX < -700;

      if (!isOpenShared.value) {
        if (flingOpen || e.translationX > DRAWER_WIDTH * 0.28) {
          runOnJS(openDrawer)();
        } else {
          runOnJS(snapClosed)();
        }
      } else if (flingClose || e.translationX < -DRAWER_WIDTH * 0.28) {
        runOnJS(closeDrawer)();
      } else {
        runOnJS(snapOpen)();
      }
    });

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: contentTranslate.value }, { scale: contentScale.value }],
    borderRadius: interpolate(drawerProgress.value, [0, 1], [0, 20], Extrapolation.CLAMP),
    overflow: 'hidden' as const,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(iconRotation.value, [0, 1], [0, 90], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  return {
    panGesture,
    drawerStyle,
    overlayStyle,
    contentStyle,
    iconStyle,
    openDrawer,
    closeDrawer,
    drawerProgress,
  };
}
