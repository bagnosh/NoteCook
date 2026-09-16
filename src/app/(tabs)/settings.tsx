// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { theme } from '../../constants/theme';

const API_KEY_STORAGE = 'notecook_gemini_key';
const SPOONACULAR_KEY_STORAGE = 'notecook_spoonacular_key';
const BUNDLED_SPOONACULAR_KEY = '7205ff6e1db94e5b8b9849ea8808f280';


export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [groqKey, setGroqKey] = useState('');
  const [groqSaved, setGroqSaved] = useState(false);
  const [spoonacularKey, setSpoonacularKey] = useState('');
  const [spoonacularSaved, setSpoonacularSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then(key => {
      if (key) setApiKey(key);
    });
    AsyncStorage.getItem(SPOONACULAR_KEY_STORAGE).then(key => {
      if (key) setSpoonacularKey(key);
    });
    AsyncStorage.getItem('notecook_groq_key').then(key => {
      if (key) setGroqKey(key);
    });
  }, []);

  async function handleSave() {
    await AsyncStorage.setItem(API_KEY_STORAGE, apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleClear() {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
    setApiKey('');
  }

  async function handleSaveSpoonacular() {
    await AsyncStorage.setItem(SPOONACULAR_KEY_STORAGE, spoonacularKey.trim());
    setSpoonacularSaved(true);
    setTimeout(() => setSpoonacularSaved(false), 2000);
  }

  async function handleClearSpoonacular() {
    await AsyncStorage.removeItem(SPOONACULAR_KEY_STORAGE);
    setSpoonacularKey('');
  }

  async function handleSaveGroq() {
    await AsyncStorage.setItem('notecook_groq_key', groqKey.trim());
    setGroqSaved(true);
    setTimeout(() => setGroqSaved(false), 2000);
  }

  async function handleClearGroq() {
    await AsyncStorage.removeItem('notecook_groq_key');
    setGroqKey('');
  }

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>

      {/* Gemini / Anthropic key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anthropic API Key</Text>
        <Text style={styles.sectionHint}>
          Reserved for future features. Get your free key at aistudio.google.com.
        </Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-..."
          placeholderTextColor={theme.colors.tabInactive}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={true}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
            onPress={handleSave}
          >
            <Ionicons
              name={saved ? 'checkmark' : 'save-outline'}
              size={18}
              color={theme.colors.headerText}
            />
            <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Key'}</Text>
          </TouchableOpacity>
          {apiKey.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Spoonacular key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spoonacular API Key (Optional)</Text>
        <Text style={styles.sectionHint}>
          Used for importing recipes from URLs. A shared key is built in — add your own at spoonacular.com/food-api if you hit the daily limit (150 imports/day).
        </Text>
        <TextInput
          style={styles.input}
          value={spoonacularKey}
          onChangeText={setSpoonacularKey}
          placeholder="Your personal key (optional)..."
          placeholderTextColor={theme.colors.tabInactive}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={true}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.saveBtn, spoonacularSaved && styles.saveBtnSuccess]}
            onPress={handleSaveSpoonacular}
          >
            <Ionicons
              name={spoonacularSaved ? 'checkmark' : 'save-outline'}
              size={18}
              color={theme.colors.headerText}
            />
            <Text style={styles.saveBtnText}>{spoonacularSaved ? 'Saved!' : 'Save Key'}</Text>
          </TouchableOpacity>
          {spoonacularKey.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearSpoonacular}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Groq key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Groq API Key</Text>
        <Text style={styles.sectionHint}>
          Used to intelligently clean and enrich imported recipes. Get your free key at console.groq.com.
        </Text>
        <TextInput
          style={styles.input}
          value={groqKey}
          onChangeText={setGroqKey}
          placeholder="gsk_..."
          placeholderTextColor={theme.colors.tabInactive}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={true}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.saveBtn, groqSaved && styles.saveBtnSuccess]}
            onPress={handleSaveGroq}
          >
            <Ionicons
              name={groqSaved ? 'checkmark' : 'save-outline'}
              size={18}
              color={theme.colors.headerText}
            />
            <Text style={styles.saveBtnText}>{groqSaved ? 'Saved!' : 'Save Key'}</Text>
          </TouchableOpacity>
          {groqKey.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClearGroq}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  section: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sectionHint: {
    fontSize: 13,
    color: theme.colors.text,
    opacity: 0.6,
    lineHeight: 18,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveBtnSuccess: {
    backgroundColor: '#27ae60',
  },
  saveBtnText: {
    color: theme.colors.headerText,
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearBtn: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    justifyContent: 'center',
  },
  clearBtnText: {
    color: theme.colors.text,
    fontSize: 14,
  },
});