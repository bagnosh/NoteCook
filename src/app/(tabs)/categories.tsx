import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { loadRecipes } from '../../constants/storage';
import { theme } from '../../constants/theme';
import { Recipe } from '../../constants/types';

type CategorySummary = {
  name: string;
  count: number;
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then((recipes: Recipe[]) => {
        const map: Record<string, number> = {};
        recipes.forEach(recipe => {
          recipe.categories.forEach(cat => {
            const key = cat.toLowerCase();
            map[key] = (map[key] || 0) + 1;
          });
        });
        const sorted = Object.entries(map)
          .map(([key, count]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            count,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(sorted);
      });
    }, [])
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Categories</Text>

      {categories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No categories yet!</Text>
          <Text style={styles.emptyHint}>Add categories when creating a recipe.</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
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
                <Text style={styles.badgeText}>{item.count}</Text>
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
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    marginTop: 8,
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