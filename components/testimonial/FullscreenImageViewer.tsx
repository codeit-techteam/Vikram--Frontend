import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import type { ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FullscreenImageViewerProps {
  source: ImageSourcePropType;
  visible: boolean;
  onClose: () => void;
}

export function FullscreenImageViewer({ source, visible, onClose }: FullscreenImageViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <StatusBar style="light" />
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.imageWrap} pointerEvents="box-none">
          <Image
            source={source}
            style={{ width: width - 32, height: height * 0.7 }}
            contentFit="contain"
            transition={200}
          />
        </View>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close image">
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
