import { useEffect, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { DrawerMenu } from '@components/DrawerMenu';
import { drawerPanelStyle, useDrawerAnimation } from '@hooks/useDrawerAnimation';

interface DrawerShellProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Rendered above the gesture area so header buttons always receive touches. */
  header?: ReactNode;
  children: ReactNode;
}

export function DrawerShell({
  isOpen,
  onOpen,
  onClose,
  header,
  children,
}: DrawerShellProps) {
  const { panGesture, drawerStyle, overlayStyle, contentStyle } = useDrawerAnimation(
    isOpen,
    onOpen,
    onClose,
  );

  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, onClose]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}>
        {isOpen ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.content, contentStyle]}>
        {header}
        <GestureDetector gesture={panGesture}>
          <View style={styles.gestureBody}>{children}</View>
        </GestureDetector>
      </Animated.View>

      <Animated.View
        style={[drawerPanelStyle.drawer, drawerStyle]}
        pointerEvents={isOpen ? 'auto' : 'none'}>
        <DrawerMenu isOpen={isOpen} onClose={onClose} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    backgroundColor: '#000000',
    zIndex: 998,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  gestureBody: {
    flex: 1,
  },
});
