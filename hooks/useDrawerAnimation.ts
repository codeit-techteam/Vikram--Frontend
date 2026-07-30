import { useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;
const OVERLAY_MAX = 0.55;

const OPEN_SPRING = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
} as const;

const CLOSE_SPRING = {
  damping: 25,
  stiffness: 180,
  mass: 0.6,
  overshootClamping: true,
} as const;

const CONTENT_CLOSE_SPRING = {
  damping: 22,
  stiffness: 180,
} as const;

const ICON_SPRING = {
  damping: 14,
  stiffness: 120,
} as const;

export const drawerPanelStyle = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
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
    overlayOpacity.value = withTiming(OVERLAY_MAX, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    contentTranslate.value = withSpring(DRAWER_WIDTH * 0.08, OPEN_SPRING);
    contentScale.value = withSpring(0.93, OPEN_SPRING);
    iconRotation.value = withSpring(1, ICON_SPRING);
    drawerProgress.value = withTiming(1, { duration: 280 });
  }, [contentScale, contentTranslate, drawerProgress, iconRotation, overlayOpacity, translateX]);

  const animateClosed = useCallback(() => {
    translateX.value = withSpring(-DRAWER_WIDTH, CLOSE_SPRING);
    overlayOpacity.value = withTiming(0, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    });
    contentTranslate.value = withSpring(0, CLOSE_SPRING);
    contentScale.value = withSpring(1, CONTENT_CLOSE_SPRING);
    iconRotation.value = withSpring(0, ICON_SPRING);
    drawerProgress.value = withTiming(0, { duration: 220 });
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
          translateX.value = -DRAWER_WIDTH + e.translationX;
          overlayOpacity.value = progress * OVERLAY_MAX;
          contentTranslate.value = e.translationX * 0.08;
          contentScale.value = 1 - progress * 0.07;
          drawerProgress.value = progress;
        }
      } else if (e.translationX < 0) {
        const progress = Math.min(1, Math.abs(e.translationX) / DRAWER_WIDTH);
        translateX.value = e.translationX;
        overlayOpacity.value = OVERLAY_MAX * (1 - progress);
        contentTranslate.value = DRAWER_WIDTH * 0.08 * (1 - progress);
        contentScale.value = 0.93 + progress * 0.07;
        drawerProgress.value = 1 - progress;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (!isOpenShared.value) {
        if (e.translationX > DRAWER_WIDTH * 0.3) {
          runOnJS(openDrawer)();
        } else {
          runOnJS(snapClosed)();
        }
      } else if (e.translationX < -DRAWER_WIDTH * 0.3) {
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
    borderRadius: interpolate(drawerProgress.value, [0, 1], [0, 16]),
    overflow: 'hidden',
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(iconRotation.value, [0, 1], [0, 90])}deg`,
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
