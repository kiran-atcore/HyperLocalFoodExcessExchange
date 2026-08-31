import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Utility to pick an image from the gallery or camera, resize & compress it on-device (~60KB),
 * and return a clean base64 Data URL (e.g. `data:image/jpeg;base64,...`) ready for upload.
 */
export const pickImageAsBase64 = async (): Promise<string | null> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access your gallery is required to select photos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      // Resize and compress on-device to ~800x800 and 0.6 quality (typically under 60-80 KB)
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipulated.base64) {
        return `data:image/jpeg;base64,${manipulated.base64}`;
      }
    }

    return null;
  } catch (error: any) {
    console.log('Image picker error:', error);
    Alert.alert('Image Selection', 'Could not process the selected image.');
    return null;
  }
};
