import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export async function pickAvatarImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Please allow photo library access to update your profile picture.');
    return null;
  }

  return new Promise((resolve) => {
    Alert.alert('Update Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const cam = await ImagePicker.requestCameraPermissionsAsync();
          if (cam.status !== 'granted') {
            resolve(null);
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          resolve(!result.canceled ? result.assets[0].uri : null);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          resolve(!result.canceled ? result.assets[0].uri : null);
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
