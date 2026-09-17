import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ReactNode, useMemo, useState } from 'react';
import {
  Image, Modal, Pressable,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { deleteRecipe, updateRecipe } from '../constants/storage';
import { theme } from '../constants/theme';
import { Recipe } from '../constants/types';

// ── Checkbox component ──
function Checkbox({ label, strikethrough }: { label: string; strikethrough?: boolean }) {
  const [checked, setChecked] = useState(false);
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={() => setChecked(!checked)}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={theme.colors.buttonSecondary} />}
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

// ── Section title with marker-highlight background ──
const highlightImages = {
  ingredients: require('@/assets/images/highlight_orange.png'),
  tools: require('@/assets/images/highlight_mint.png'),
  steps: require('@/assets/images/highlight_purple.png'),
  notes: require('@/assets/images/highlight_orange.png'),
};

const HIGHLIGHT_PAD_X = 10;
const HIGHLIGHT_PAD_Y = 6;

function HighlightTitle({
  label,
  highlight,
  textColor,
}: {
  label: string;
  highlight: keyof typeof highlightImages;
  textColor?: string;
}) {
  const [textSize, setTextSize] = useState<{ width: number; height: number } | null>(null);
  const imageStyle = useMemo(() => {
    if (!textSize) return null;
    return [
      styles.highlightImage,
      {
        width: textSize.width + HIGHLIGHT_PAD_X * 2,
        height: textSize.height + HIGHLIGHT_PAD_Y * 2,
        left: -HIGHLIGHT_PAD_X,
        top: -HIGHLIGHT_PAD_Y,
      },
    ];
  }, [textSize]);
  const textStyle = useMemo(
    () => (textColor ? [styles.highlightText, { color: textColor }] : styles.highlightText),
    [textColor]
  );
  return (
    <View style={styles.highlightWrap}>
      {imageStyle && (
        <Image source={highlightImages[highlight]} style={imageStyle} resizeMode="stretch" />
      )}
      <Text
        style={textStyle}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setTextSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Semi-transparent card wrapping a section, to separate it from the paper texture ──
function SectionCard({ children }: { children: ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

// ── Notes card, same shape as a SectionCard with its own background color ──
function NotesBox({ children }: { children: ReactNode }) {
  return <View style={[styles.sectionCard, styles.notesCard]}>{children}</View>;
}

// ── Item grid: single column, or two columns once there are enough items ──
function ItemGrid({ items, twoColumnThreshold = 5 }: { items: ReactNode[]; twoColumnThreshold?: number }) {
  const twoColumn = items.length >= twoColumnThreshold;
  if (!twoColumn) {
    return <View>{items}</View>;
  }
  return (
    <View style={styles.itemGrid}>
      {items.map((item, i) => (
        <View key={i} style={styles.itemGridCell}>{item}</View>
      ))}
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
  recipe.favourite = favourite;
  console.log('Photo URI:', recipe.photo);

  async function handleToggleFavourite() {
    const next = !favourite;
    setFavourite(next);
    await updateRecipe({ ...recipe, favourite: next });
  }

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
          <TouchableOpacity onPress={handleToggleFavourite}>
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
      <View style={styles.body}>
        <View style={[styles.paperBackground, { pointerEvents: 'none' }]}>
          <Image
            source={require('@/assets/images/paper.png')}
            style={styles.paperBackgroundImage}
            resizeMode="cover"
          />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.bodyContent}>

        <View style={styles.contentInner}>

        {/* Photo */}
        {recipe.photo && (
          <View style={styles.photoWrap}>
            <Image
              source={{ uri: recipe.photo }}
              style={styles.photo}
              resizeMode="cover"
              onError={(e) => console.log('Image error:', e.nativeEvent.error)}
            />
            <Image
              source={require('@/assets/images/frame_empty_round.png')}
              style={[styles.photoFrame, { pointerEvents: 'none' }]}
              resizeMode="stretch"
              tintColor="#f8f1e7"
            />
          </View>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <SectionCard>
            <HighlightTitle label="Ingredients" highlight="ingredients" />
            <ItemGrid
              items={recipe.ingredients.map((ing, i) => (
                <Checkbox
                  key={i}
                  label={`${ing.amount} ${ing.unit} ${ing.name}`.trim()}
                />
              ))}
            />
          </SectionCard>
        )}

        {/* Tools */}
        {recipe.tools.length > 0 && (
          <SectionCard>
            <HighlightTitle label="Tools" highlight="tools" />
            <ItemGrid
              items={recipe.tools.map((tool, i) => (
                <Checkbox key={i} label={tool} />
              ))}
            />
          </SectionCard>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <SectionCard>
            <HighlightTitle label="Steps" highlight="steps" />
            {recipe.steps.map((step, i) => (
              <Checkbox key={i} label={`${i + 1}. ${step}`} />
            ))}
          </SectionCard>
        )}

        {/* Notes */}
        {recipe.notes ? (
          <NotesBox>
            <HighlightTitle label="Notes" highlight="notes" textColor="#6F4E37" />
            <Text style={styles.notesText}>{recipe.notes}</Text>
          </NotesBox>
        ) : null}

        </View>

        </ScrollView>
      </View>

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
  paperBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  paperBackgroundImage: {
    position: 'absolute',
    top: '-15%',
    left: '-2.5%',
    width: '130%',
    height: '130%',
  },
  scrollView: { flex: 1 },
  bodyContent: {
    flexGrow: 1,
  },
  contentInner: {
    padding: 16,
    gap: 8,
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: theme.colors.secondary,
  },
  photoFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  // Section card (semi-transparent, sits over the paper texture)
  sectionCard: {
    backgroundColor: 'rgba(252, 248, 243, 0.94)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  // Section titles
  highlightWrap: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 8,
  },
  highlightImage: {
    position: 'absolute',
  },
  highlightText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },

  // Item grid (single or two columns)
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemGridCell: {
    width: '48%',
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
    borderColor: theme.colors.buttonSecondary,
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

  // Notes card
  notesCard: {
    backgroundColor: '#D2915A',
  },
  notesText: {
    fontSize: 14,
    color: '#6F4E37',
    opacity: 0.9,
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