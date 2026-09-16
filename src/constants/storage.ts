import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Recipe } from './types';

const RECIPES_KEY = 'notecook_recipes';
const CATEGORIES_KEY = 'notecook_categories';

// ── Recipes ──

export async function loadRecipes(): Promise<Recipe[]> {
  try {
    const data = await AsyncStorage.getItem(RECIPES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveRecipes(recipes: Recipe[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
  } catch (e) {
    console.error('Failed to save recipes:', e);
  }
}

export async function addRecipe(recipe: Recipe): Promise<void> {
  const recipes = await loadRecipes();
  recipes.push(recipe);
  await saveRecipes(recipes);
}

export async function updateRecipe(updated: Recipe): Promise<void> {
  const recipes = await loadRecipes();
  const index = recipes.findIndex(r => r.id === updated.id);
  if (index !== -1) {
    recipes[index] = updated;
    await saveRecipes(recipes);
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  const recipes = await loadRecipes();
  await saveRecipes(recipes.filter(r => r.id !== id));
}

// ── Categories ──

export async function loadCategories(): Promise<Category[]> {
  try {
    const data = await AsyncStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveCategories(categories: Category[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories:', e);
  }
}

export async function addCategory(category: Category): Promise<void> {
  const categories = await loadCategories();
  categories.push(category);
  await saveCategories(categories);
}

export async function deleteCategory(id: string): Promise<void> {
  const categories = await loadCategories();
  await saveCategories(categories.filter(c => c.id !== id));
}