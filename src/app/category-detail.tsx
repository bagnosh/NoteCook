// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { loadRecipes, saveRecipes } from '../constants/storage';
import { theme } from '../constants/theme';
import { Recipe } from '../constants/types';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params.category as string;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [renameVisible, setRenameVisible] = useState(false);
  const [newName, setNewName] = useState(category);
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  const visibleRecipes = favouritesOnly ? recipes.filter(r => r.favourite) : recipes;

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then((all: Recipe[]) => {
        setRecipes(all.filter(r =>
          r.categories.map(c => c.toLowerCase()).includes(category.toLowerCase())
        ));
      });
    }, [category])
  );

  async function handleRename() {
    const normalized = newName.trim().charAt(0).toUpperCase() + newName.trim().slice(1).toLowerCase();
    if (!normalized) return;
    const all = await loadRecipes();
    const updated = all.map(r => ({
      ...r,
      categories: r.categories.map(c =>
        c.toLowerCase() === category.toLowerCase() ? normalized : c
      ),
    }));
    await saveRecipes(updated);
    setRenameVisible(false);
    router.back();
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Category',
      `Remove "${category}" from all recipes? The recipes themselves won't be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const all = await loadRecipes();
            const updated = all.map(r => ({
              ...r,
              categories: r.categories.filter(c =>
                c.toLowerCase() !== category.toLowerCase()
              ),
            }));
            await saveRecipes(updated);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.headerText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
        <TouchableOpacity onPress={() => setFavouritesOnly(!favouritesOnly)} style={styles.headerBtn}>
          <Ionicons
            name={favouritesOnly ? 'star' : 'star-outline'}
            size={20}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRenameVisible(true)} style={styles.headerBtn}>
          <Ionicons name="pencil" size={20} color={theme.colors.headerText} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
          <Ionicons name="trash" size={20} color={theme.colors.headerText} />
        </TouchableOpacity>
      </View>

      {/* Recipe list */}
      {visibleRecipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {favouritesOnly ? 'No favourite recipes in this category.' : 'No recipes in this category.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleRecipes}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({
                pathname: '/recipe' as any,
                params: { recipe: JSON.stringify(item) }
              })}
            >
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.favourite && (
                  <Ionicons name="star" size={15} color={theme.colors.buttonSecondary} />
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Rename Modal */}
      <Modal visible={renameVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setRenameVisible(false)} activeOpacity={1}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
            <Text style={styles.modalTitle}>Rename Category</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              placeholderTextColor={theme.colors.tabInactive}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setRenameVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleRename}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
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
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  headerBtn: { padding: 4 },
  list: { padding: 16, gap: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.text, opacity: 0.5 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: theme.colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  modalInput: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: theme.colors.text,
  },
  modalButtons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cancelBtn: { backgroundColor: theme.colors.secondary },
  cancelBtnText: { color: theme.colors.text, fontWeight: '500' },
  saveBtn: { backgroundColor: theme.colors.buttonPrimary },
  saveBtnText: { color: theme.colors.headerText, fontWeight: 'bold' },
});