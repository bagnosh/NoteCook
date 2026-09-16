import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  Image, Modal, Pressable,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { deleteRecipe } from '../constants/storage';
import { theme } from '../constants/theme';
import { Recipe } from '../constants/types';

// ── Checkbox component ──
function Checkbox({ label, strikethrough }: { label: string; strikethrough?: boolean }) {
  const [checked, setChecked] = useState(false);
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={() => setChecked(!checked)}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={theme.colors.highlight} />}
      </View>
      <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelChecked]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Category pill ──
function CategoryPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

// ── Main screen ──
export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [menuVisible, setMenuVisible] = useState(false);
  const [favourite, setFavourite] = useState<boolean>(
    JSON.parse(params.recipe as string).favourite
  );

  // Parse recipe from route params
  const recipe: Recipe = JSON.parse(params.recipe as string);
  if (recipe.photo) {
    recipe.photo = decodeURIComponent(recipe.photo);
  }
  console.log('Photo URI:', recipe.photo);

  async function handleExportText() {
    setMenuVisible(false);
    const lines: string[] = [];

    lines.push(recipe.title.toUpperCase());
    lines.push('='.repeat(recipe.title.length));
    lines.push('');

    if (recipe.categories.length > 0) {
      lines.push(`Categories: ${recipe.categories.join(', ')}`);
      lines.push('');
    }

    if (recipe.ingredients.length > 0) {
      lines.push('INGREDIENTS:');
      recipe.ingredients.forEach(ing => {
        lines.push(`  - ${ing.amount} ${ing.unit} ${ing.name}`.trim());
      });
      lines.push('');
    }

    if (recipe.tools.length > 0) {
      lines.push('TOOLS:');
      recipe.tools.forEach(tool => {
        lines.push(`  - ${tool}`);
      });
      lines.push('');
    }

    if (recipe.steps.length > 0) {
      lines.push('STEPS:');
      recipe.steps.forEach((step, i) => {
        lines.push(`  ${i + 1}. ${step}`);
      });
      lines.push('');
    }

    if (recipe.notes) {
      lines.push('NOTES:');
      lines.push(`  ${recipe.notes}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('Exported from NoteCook');

    const text = lines.join('\n');

    // Write to a temp file and share
    const { StorageAccessFramework } = await import('expo-file-system/legacy');
    const filename = `${recipe.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    const fileUri = `${(await import('expo-file-system/legacy')).documentDirectory}${filename}`;
    await (await import('expo-file-system/legacy')).writeAsStringAsync(fileUri, text);
    await Sharing.shareAsync(fileUri, { mimeType: 'text/plain' });
  }

  return (
    <View style={styles.wrapper}>

      {/* ── Sticky Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.headerText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{recipe.title}</Text>
          <TouchableOpacity onPress={() => setFavourite(!favourite)}>
            <Ionicons
              name={favourite ? 'star' : 'star-outline'}
              size={22}
              color={favourite ? '#f8f1e7' : theme.colors.headerText}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <Ionicons name="menu" size={22} color={theme.colors.headerText} />
          </TouchableOpacity>
        </View>

        {/* Category pills */}
        <View style={styles.pillRow}>
          {recipe.categories.map((cat, i) => (
            <CategoryPill key={i} label={cat} />
          ))}
        </View>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* Photo */}
        {recipe.photo && (
          <Image
            source={{ uri: recipe.photo }}
            style={styles.photo}
            resizeMode="cover"
            onError={(e) => console.log('Image error:', e.nativeEvent.error)}
          />
        )}

        {/* Ingredients + Tools */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Ingredients:</Text>
            {recipe.ingredients.map((ing, i) => (
              <Checkbox
                key={i}
                label={`${ing.amount} ${ing.unit} ${ing.name}`.trim()}
              />
            ))}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Tools:</Text>
            {recipe.tools.map((tool, i) => (
              <Text key={i} style={styles.toolItem}>{tool}</Text>
            ))}
          </View>
        </View>

        {/* Steps */}
        <Text style={styles.sectionTitle}>Steps:</Text>
        {recipe.steps.map((step, i) => (
          <Checkbox key={i} label={`${i + 1}. ${step}`} />
        ))}

        {/* Notes */}
        {recipe.notes ? (
          <>
            <Text style={styles.sectionTitle}>Notes:</Text>
            <Text style={styles.notes}>{recipe.notes}</Text>
          </>
        ) : null}

      </ScrollView>

      {/* ── Menu Modal ── */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push({ pathname: '/edit-recipe' as any, params: { recipe: JSON.stringify(recipe) } });
              }}
            >
              <Ionicons name="pencil" size={18} color={theme.colors.text} />
              <Text style={styles.menuItemText}>Edit Recipe</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuVisible(false);
                await deleteRecipe(recipe.id);
                router.back();
              }}
            >
              <Ionicons name="trash" size={18} color="#e74c3c" />
              <Text style={[styles.menuItemText, { color: '#e74c3c' }]}>Delete Recipe</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleExportText()}
            >
              <Ionicons name="share-social" size={18} color={theme.colors.text} />
              <Text style={styles.menuItemText}>Export as Text</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Header
  header: {
    backgroundColor: theme.colors.header,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.headerText,
  },
  menuButton: {
    marginLeft: 4,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pill: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 13,
    color: theme.colors.text,
  },

  // Body
  body: { flex: 1 },
  bodyContent: {
    padding: 16,
    gap: 8,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: theme.colors.secondary,
  },

  // Two column layout
  twoCol: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  col: { flex: 1 },

  // Section titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 4,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.buttonPrimary,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: theme.colors.highlight,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  checkboxLabelChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },

  // Tools
  toolItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'right',
  },

  // Notes
  notes: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.8,
    lineHeight: 20,
  },

  // Menu modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  menuBox: {
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    padding: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  menuItemText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 8,
  },
});