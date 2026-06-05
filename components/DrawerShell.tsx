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
  children: ReactNode;
}

export function DrawerShell({ isOpen, onOpen, onClose, children }: DrawerShellProps) {
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
    <GestureDetector gesture={panGesture}>
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
          pointerEvents={isOpen ? 'auto' : 'none'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.content, contentStyle]}>{children}</Animated.View>

        <Animated.View style={[drawerPanelStyle.drawer, drawerStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
          <DrawerMenu isOpen={isOpen} onClose={onClose} />
        </Animated.View>
      </View>
    </GestureDetector>
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
});
