// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SplashAnimation from '../../components/SplashAnimation';
import { loadRecipes } from '../../constants/storage';
import { theme } from '../../constants/theme';
import { Recipe } from '../../constants/types';

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then(setRecipes);
    }, [])
  );

  if (showSplash) {
    return <SplashAnimation onFinish={() => setShowSplash(false)} />;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>My Recipes</Text>

      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recipes yet!</Text>
          <Text style={styles.emptyHint}>Tap + to add your first one.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
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
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.pillRow}>
                {item.categories.map((cat, i) => (
                  <View key={i} style={styles.pill}>
                    <Text style={styles.pillText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB Menu */}
      {fabMenuVisible && (
        <View style={styles.fabMenu}>
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              setFabMenuVisible(false);
              router.push({ pathname: '/new-recipe' as any });
            }}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.text} />
            <Text style={styles.fabMenuText}>New Recipe</Text>
          </TouchableOpacity>
          <View style={styles.fabMenuDivider} />
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => {
              setFabMenuVisible(false);
              router.push({ pathname: '/import-recipe' as any });
            }}
          >
            <Ionicons name="link-outline" size={20} color={theme.colors.text} />
            <Text style={styles.fabMenuText}>Import from URL</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setFabMenuVisible(!fabMenuVisible)}
      >
        <Text style={styles.fabText}>{fabMenuVisible ? '✕' : '＋'}</Text>
      </TouchableOpacity>
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
  list: {
    gap: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    opacity: 0.5,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.4,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.buttonPrimary,
    opacity: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: theme.colors.background,
    lineHeight: 36,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    minWidth: 180,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  fabMenuText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  fabMenuDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 8,
  },
});