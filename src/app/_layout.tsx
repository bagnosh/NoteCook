import { Stack } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 25 : 0}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipe" options={{ headerShown: false }} />
        <Stack.Screen name="edit-recipe" options={{ headerShown: false }} />
        <Stack.Screen name="new-recipe" options={{ headerShown: false }} />
        <Stack.Screen name="category-detail" options={{ headerShown: false }} />
        <Stack.Screen name="import-recipe" options={{ headerShown: false }} />
      </Stack>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});