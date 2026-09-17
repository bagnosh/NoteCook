import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loadRecipes } from '../../constants/storage';
import { theme } from '../../constants/theme';
import { Recipe } from '../../constants/types';

type CategorySummary = {
  name: string;
  count: number;
  favouriteCount: number;
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then((recipes: Recipe[]) => {
        const map: Record<string, { count: number; favouriteCount: number }> = {};
        recipes.forEach(recipe => {
          recipe.categories.forEach(cat => {
            const key = cat.toLowerCase();
            if (!map[key]) map[key] = { count: 0, favouriteCount: 0 };
            map[key].count++;
            if (recipe.favourite) map[key].favouriteCount++;
          });
        });
        const sorted = Object.entries(map)
          .map(([key, { count, favouriteCount }]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            count,
            favouriteCount,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(sorted);
      });
    }, [])
  );

  const visibleCategories = favouritesOnly
    ? categories.filter(c => c.favouriteCount > 0)
    : categories;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Categories</Text>
        <TouchableOpacity
          style={[styles.favToggle, favouritesOnly && styles.favToggleActive]}
          onPress={() => setFavouritesOnly(!favouritesOnly)}
        >
          <Ionicons
            name={favouritesOnly ? 'star' : 'star-outline'}
            size={16}
            color={favouritesOnly ? theme.colors.headerText : theme.colors.buttonPrimary}
          />
          <Text style={[styles.favToggleText, favouritesOnly && styles.favToggleTextActive]}>
            Favourites
          </Text>
        </TouchableOpacity>
      </View>

      {visibleCategories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {favouritesOnly ? 'No favourite recipes yet!' : 'No categories yet!'}
          </Text>
          <Text style={styles.emptyHint}>
            {favouritesOnly
              ? 'Star a recipe to see its category here.'
              : 'Add categories when creating a recipe.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleCategories}
          keyExtractor={item => item.name}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({
                pathname: '/category-detail' as any,
                params: { category: item.name }
              })}
            >
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {favouritesOnly ? item.favouriteCount : item.count}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  favToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.buttonPrimary,
  },
  favToggleActive: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  favToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.buttonPrimary,
  },
  favToggleTextActive: {
    color: theme.colors.headerText,
  },
  list: {
    gap: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  badge: {
    backgroundColor: theme.colors.buttonSecondary,
    borderRadius: 20,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});