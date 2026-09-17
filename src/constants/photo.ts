import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

async function pickFrom(source: 'camera' | 'library'): Promise<string | null> {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permission needed',
      `NoteCook needs ${source === 'camera' ? 'camera' : 'photo library'} access to add a photo.`
    );
    return null;
  }

  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });

  if (result.canceled || !result.assets?.[0]) return null;

  const pickedUri = result.assets[0].uri;
  if (Platform.OS === 'web') {
    // expo-file-system's document directory isn't available on web; the
    // picker already returns a stable object/data URI for the session.
    return pickedUri;
  }

  // Copy into the app's own document directory so the photo survives
  // beyond the picker's temporary/cache URI.
  const destUri = `${FileSystem.documentDirectory}recipe_photo_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: pickedUri, to: destUri });
  return destUri;
}

export function pickRecipePhoto(): Promise<string | null> {
  // react-native-web doesn't implement Alert.alert, so the custom source
  // chooser below never resolves there. Go straight to the library picker
  // on web -- mobile browsers already offer their own camera/file choice.
  if (Platform.OS === 'web') {
    return pickFrom('library');
  }
  return new Promise((resolve) => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: () => pickFrom('camera').then(resolve) },
      { text: 'Choose from Library', onPress: () => pickFrom('library').then(resolve) },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
