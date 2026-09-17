import { ScrollView, StyleSheet, Text, View } from 'react-native';
import UnitConverter from '../../components/UnitConverter';
import { theme } from '../../constants/theme';

export default function ConvertScreen() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Unit Converter</Text>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <UnitConverter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  content: {
    paddingBottom: 24,
  },
});
