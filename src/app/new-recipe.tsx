// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { addRecipe } from '../constants/storage';
import { theme } from '../constants/theme';
import { Ingredient, Recipe } from '../constants/types';

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}
//
export default function NewRecipeScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ amount: '', unit: '', name: '' }]);
  const [tools, setTools] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.prefill) {
      const data = JSON.parse(params.prefill as string);
      if (data.title) setTitle(data.title);
      if (data.categories) setCategories(data.categories);
      if (data.ingredients) setIngredients(data.ingredients);
      if (data.tools) setTools(data.tools.length > 0 ? data.tools : ['']);
      if (data.steps) setSteps(data.steps.length > 0 ? data.steps : ['']);
      if (data.notes) setNotes(data.notes);
      if (data.photo) setPhoto(data.photo);
    }
  }, [params.prefill]);

  function addCategory() {
    const parts = categoryInput.split(',');
    const newCats = parts
      .map(p => {
        const trimmed = p.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      })
      .filter(p => p && !categories.map(c => c.toLowerCase()).includes(p.toLowerCase()));
    if (newCats.length > 0) {
      setCategories([...categories, ...newCats]);
    }
    setCategoryInput('');
  }
  function removeCategory(cat: string) {
    setCategories(categories.filter(c => c !== cat));
  }
  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }
  function addIngredient() {
    setIngredients([...ingredients, { amount: '', unit: '', name: '' }]);
  }
  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }
  function updateTool(index: number, value: string) {
    const updated = [...tools];
    updated[index] = value;
    setTools(updated);
  }
  function addTool() {
    setTools([...tools, '']);
  }
  function removeTool(index: number) {
    setTools(tools.filter((_, i) => i !== index));
  }
  function updateStep(index: number, value: string) {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  }
  function addStep() {
    setSteps([...steps, '']);
  }
  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  async function handlePickPhoto() {
    // Photo picking will be implemented in the APK build
  }

  async function handleSave() {
    if (!title.trim()) return;
    const now = Date.now();
    const recipe: Recipe = {
      id: generateId(),
      title: title.trim(),
      categories,
      ingredients: ingredients.filter(i => i.name.trim()),
      tools: tools.filter(t => t.trim()),
      steps: steps.filter(s => s.trim()),
      notes: notes.trim(),
      photo: photo,
      favourite: false,
      createdAt: now,
      updatedAt: now,
    };
    await addRecipe(recipe);
    router.replace({
      pathname: '/(tabs)' as any,
    });
    router.push({
      pathname: '/recipe' as any,
      params: { recipe: JSON.stringify(recipe) }
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.headerText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Recipe</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe name..."
          placeholderTextColor={theme.colors.tabInactive}
        />

        <Text style={styles.label}>Categories</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={categoryInput}
            onChangeText={setCategoryInput}
            placeholder="Add category... (separate with commas)"
            placeholderTextColor={theme.colors.tabInactive}
            onSubmitEditing={addCategory}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
            <Ionicons name="add" size={22} color={theme.colors.headerText} />
          </TouchableOpacity>
        </View>
        <View style={styles.pillRow}>
          {categories.map((cat, i) => (
            <TouchableOpacity key={i} style={styles.pill} onPress={() => removeCategory(cat)}>
              <Text style={styles.pillText}>{cat} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Ingredients</Text>
        {ingredients.map((ing, i) => (
          <View key={i} style={styles.row}>
            <TextInput
              style={[styles.input, { width: 52 }]}
              value={ing.amount}
              onChangeText={v => {
                if (/^[0-9/. ]*$/.test(v)) {
                  updateIngredient(i, 'amount', v);
                }
              }}
              placeholder="Amt"
              placeholderTextColor={theme.colors.tabInactive}
              keyboardType="default"
            />
            <TextInput
              style={[styles.input, { width: 52 }]}
              value={ing.unit}
              onChangeText={v => updateIngredient(i, 'unit', v)}
              placeholder="Unit"
              placeholderTextColor={theme.colors.tabInactive}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={ing.name}
              onChangeText={v => updateIngredient(i, 'name', v)}
              placeholder="Ingredient..."
              placeholderTextColor={theme.colors.tabInactive}
            />
            <TouchableOpacity onPress={() => removeIngredient(i)}>
              <Ionicons name="close-circle" size={22} color={theme.colors.buttonSecondary} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addRowBtn} onPress={addIngredient}>
          <Ionicons name="add" size={18} color={theme.colors.buttonPrimary} />
          <Text style={styles.addRowText}>Add Ingredient</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Tools</Text>
        {tools.map((tool, i) => (
          <View key={i} style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={tool}
              onChangeText={v => updateTool(i, v)}
              placeholder="Tool..."
              placeholderTextColor={theme.colors.tabInactive}
            />
            <TouchableOpacity onPress={() => removeTool(i)}>
              <Ionicons name="close-circle" size={22} color={theme.colors.buttonSecondary} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addRowBtn} onPress={addTool}>
          <Ionicons name="add" size={18} color={theme.colors.buttonPrimary} />
          <Text style={styles.addRowText}>Add Tool</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Steps</Text>
        {steps.map((step, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.stepNumber}>{i + 1}.</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={step}
              onChangeText={v => updateStep(i, v)}
              placeholder="Step..."
              placeholderTextColor={theme.colors.tabInactive}
              multiline
            />
            <TouchableOpacity onPress={() => removeStep(i)}>
              <Ionicons name="close-circle" size={22} color={theme.colors.buttonSecondary} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addRowBtn} onPress={addStep}>
          <Ionicons name="add" size={18} color={theme.colors.buttonPrimary} />
          <Text style={styles.addRowText}>Add Step</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any extra notes..."
          placeholderTextColor={theme.colors.tabInactive}
          multiline
        />

        {/* Photo */}
        <Text style={styles.label}>Photo</Text>
        <TouchableOpacity style={styles.photoBox} onPress={handlePickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={32} color={theme.colors.tabInactive} />
              <Text style={styles.photoPlaceholderText}>Tap to add a photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {photo && (
          <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    backgroundColor: theme.colors.header,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: theme.colors.headerText },
  saveButton: {
    backgroundColor: theme.colors.buttonSecondary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  photoBox: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.white,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: theme.colors.tabInactive,
  },
  removePhoto: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  removePhotoText: {
    fontSize: 13,
    color: '#e74c3c',
  },
  saveButtonText: { color: theme.colors.headerText, fontWeight: 'bold', fontSize: 14 },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 8 },
  label: { fontSize: 15, fontWeight: 'bold', color: theme.colors.text, marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.text,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  addBtn: { backgroundColor: theme.colors.buttonPrimary, borderRadius: 8, padding: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  pill: { backgroundColor: theme.colors.secondary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 13, color: theme.colors.text },
  stepNumber: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text, width: 20 },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, marginBottom: 4 },
  addRowText: { fontSize: 14, color: theme.colors.buttonPrimary, fontWeight: '500' },
});