// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { loadRecipes } from '../../constants/storage';
import { theme } from '../../constants/theme';
import { Recipe } from '../../constants/types';

export default function SearchScreen() {
  const router = useRouter();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [nameQuery, setNameQuery] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientTags, setIngredientTags] = useState<string[]>([]);
  const [matchAll, setMatchAll] = useState(true);
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecipes().then(setAllRecipes);
    }, [])
  );

  function addIngredientTag() {
    const val = ingredientInput.trim().toLowerCase();
    if (val && !ingredientTags.includes(val)) {
      setIngredientTags([...ingredientTags, val]);
      setIngredientInput('');
    }
  }

  function removeIngredientTag(tag: string) {
    setIngredientTags(ingredientTags.filter(t => t !== tag));
  }

  // ── Filtering logic ──
  const results = allRecipes.filter(recipe => {
    // Name filter
    const nameMatch = nameQuery.trim() === '' ||
      recipe.title.toLowerCase().includes(nameQuery.toLowerCase());

    // Ingredient filter
    let ingredientMatch = true;
    if (ingredientTags.length > 0) {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      if (matchAll) {
        ingredientMatch = ingredientTags.every(tag =>
          recipeIngredients.some(ing => ing.includes(tag))
        );
      } else {
        ingredientMatch = ingredientTags.some(tag =>
          recipeIngredients.some(ing => ing.includes(tag))
        );
      }
    }

    // Favourites filter
    const favMatch = !favouritesOnly || recipe.favourite;

    return nameMatch && ingredientMatch && favMatch;
  });

  const hasFilters = nameQuery.trim() !== '' || ingredientTags.length > 0 || favouritesOnly;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Search</Text>

      {/* Name search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={theme.colors.tabInactive} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={nameQuery}
          onChangeText={setNameQuery}
          placeholder="Search by recipe name..."
          placeholderTextColor={theme.colors.tabInactive}
        />
        {nameQuery.length > 0 && (
          <TouchableOpacity onPress={() => setNameQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.colors.tabInactive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Ingredient search */}
      <View style={styles.searchRow}>
        <Ionicons name="nutrition" size={18} color={theme.colors.tabInactive} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={ingredientInput}
          onChangeText={setIngredientInput}
          placeholder="Add ingredient to filter..."
          placeholderTextColor={theme.colors.tabInactive}
          onSubmitEditing={addIngredientTag}
          returnKeyType="done"
        />
        {ingredientInput.length > 0 && (
          <TouchableOpacity onPress={addIngredientTag}>
            <Ionicons name="add-circle" size={18} color={theme.colors.buttonPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Favourites-only toggle */}
      <TouchableOpacity
        style={[styles.favBtn, favouritesOnly && styles.favBtnActive]}
        onPress={() => setFavouritesOnly(!favouritesOnly)}
      >
        <Ionicons
          name={favouritesOnly ? 'star' : 'star-outline'}
          size={16}
          color={favouritesOnly ? theme.colors.headerText : theme.colors.buttonPrimary}
        />
        <Text style={[styles.favBtnText, favouritesOnly && styles.favBtnTextActive]}>
          Favourites only
        </Text>
      </TouchableOpacity>

      {/* Ingredient tags */}
      {ingredientTags.length > 0 && (
        <View style={styles.tagRow}>
          {ingredientTags.map((tag, i) => (
            <TouchableOpacity key={i} style={styles.tag} onPress={() => removeIngredientTag(tag)}>
              <Text style={styles.tagText}>{tag} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ALL / ANY toggle */}
      {ingredientTags.length > 1 && (
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Match:</Text>
          <TouchableOpacity
            style={[styles.toggleBtn, matchAll && styles.toggleBtnActive]}
            onPress={() => setMatchAll(true)}
          >
            <Text style={[styles.toggleBtnText, matchAll && styles.toggleBtnTextActive]}>
              ALL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !matchAll && styles.toggleBtnActive]}
            onPress={() => setMatchAll(false)}
          >
            <Text style={[styles.toggleBtnText, !matchAll && styles.toggleBtnTextActive]}>
              ANY
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {!hasFilters ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Start typing to search!</Text>
          <Text style={styles.emptyHint}>Search by name or add ingredients from your pantry.</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recipes found.</Text>
          <Text style={styles.emptyHint}>Try different ingredients or a broader name.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
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
              {item.categories.length > 0 && (
                <View style={styles.pillRow}>
                  {item.categories.map((cat, i) => (
                    <View key={i} style={styles.pill}>
                      <Text style={styles.pillText}>{cat}</Text>
                    </View>
                  ))}
                </View>
              )}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: { marginRight: 2 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tag: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.buttonPrimary,
    marginBottom: 10,
  },
  favBtnActive: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  favBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.buttonPrimary,
  },
  favBtnTextActive: {
    color: theme.colors.headerText,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  toggleLabel: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.buttonPrimary,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.buttonPrimary,
  },
  toggleBtnText: {
    fontSize: 13,
    color: theme.colors.buttonPrimary,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: theme.colors.headerText,
  },
  list: { gap: 10 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    opacity: 0.5,
  },
  emptyHint: {
    fontSize: 13,
    color: theme.colors.text,
    opacity: 0.4,
    textAlign: 'center',
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
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
});