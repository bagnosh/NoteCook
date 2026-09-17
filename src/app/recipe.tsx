import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ReactNode, useMemo, useRef, useState } from 'react';
import {
  Alert, Image, Modal, Pressable,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import UnitConverter from '../components/UnitConverter';
import { deleteRecipe, updateRecipe } from '../constants/storage';
import { theme } from '../constants/theme';
import { Recipe } from '../constants/types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function resolvePhotoSrc(photo: string | null): Promise<string | null> {
  if (!photo) return null;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  // Local file:// URIs generally aren't loadable inside the native print
  // WebView, so inline the photo as a base64 data URI instead.
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const base64 = await FileSystem.readAsStringAsync(photo, { encoding: 'base64' });
    const ext = photo.split('.').pop()?.toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch (e) {
    console.error('Failed to inline photo for PDF export:', e);
    return null;
  }
}

async function buildRecipeHtml(recipe: Recipe): Promise<string> {
  const categoriesHtml = recipe.categories.length
    ? `<div class="categories">${recipe.categories.map(escapeHtml).join(' &bull; ')}</div>`
    : '';

  const photoSrc = await resolvePhotoSrc(recipe.photo);
  const photoHtml = photoSrc
    ? `<img class="photo" src="${photoSrc}" />`
    : '';

  const ingredientsHtml = recipe.ingredients.length
    ? `<h2>Ingredients</h2><ul>${recipe.ingredients
        .map(ing => `<li>${escapeHtml(`${ing.amount} ${ing.unit} ${ing.name}`.trim())}</li>`)
        .join('')}</ul>`
    : '';

  const toolsHtml = recipe.tools.length
    ? `<h2>Tools</h2><ul>${recipe.tools.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
    : '';

  const stepsHtml = recipe.steps.length
    ? `<h2>Steps</h2><ol>${recipe.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`
    : '';

  const notesHtml = recipe.notes
    ? `<h2>Notes</h2><p class="notes">${escapeHtml(recipe.notes)}</p>`
    : '';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #4D3A2C; padding: 24px; }
          h1 { color: #6F4E37; margin-bottom: 4px; }
          .categories { color: #9C8576; margin-bottom: 16px; font-size: 14px; }
          h2 { color: #D2915A; margin-top: 24px; margin-bottom: 8px; font-size: 18px; border-bottom: 2px solid #E5C39E; padding-bottom: 4px; }
          ul, ol { margin: 0; padding-left: 20px; }
          li { margin-bottom: 6px; }
          .notes { white-space: pre-wrap; }
          .photo { max-width: 100%; border-radius: 12px; margin: 16px 0; }
          .footer { margin-top: 32px; text-align: center; color: #9C8576; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(recipe.title)}</h1>
        ${categoriesHtml}
        ${photoHtml}
        ${ingredientsHtml}
        ${toolsHtml}
        ${stepsHtml}
        ${notesHtml}
        <div class="footer">Exported from NoteCook</div>
      </body>
    </html>
  `;
}

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
  const [converterVisible, setConverterVisible] = useState(false);
  const [favourite, setFavourite] = useState<boolean>(
    JSON.parse(params.recipe as string).favourite
  );
  const exportCardRef = useRef<View>(null);

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

  async function handleExportPdf() {
    setMenuVisible(false);
    try {
      const html = await buildRecipeHtml(recipe);
      const result = await Print.printToFileAsync({ html });
      if (!result?.uri) {
        Alert.alert('Export failed', 'Could not generate a PDF on this device.');
        return;
      }
      await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e) {
      console.error('Failed to export PDF:', e);
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert('Export failed', `Could not generate a PDF on this device.\n\n${message}`);
    }
  }

  async function handleExportPng() {
    setMenuVisible(false);
    if (!exportCardRef.current) return;
    try {
      const uri = await captureRef(exportCardRef.current, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
    } catch (e) {
      console.error('Failed to export image:', e);
      Alert.alert('Export failed', 'Could not generate an image on this device.');
    }
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
              <Ionicons name="document-text-outline" size={18} color={theme.colors.text} />
              <Text style={styles.menuItemText}>Export as Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleExportPdf()}
            >
              <Ionicons name="document-outline" size={18} color={theme.colors.text} />
              <Text style={styles.menuItemText}>Export as PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleExportPng()}
            >
              <Ionicons name="image-outline" size={18} color={theme.colors.text} />
              <Text style={styles.menuItemText}>Export as Image</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── Hidden card used to capture the PNG export -- rendered off-screen ── */}
      <View style={styles.exportCardWrap} pointerEvents="none">
        <View ref={exportCardRef} collapsable={false} style={styles.exportCard}>
          <Text style={styles.exportTitle}>{recipe.title}</Text>
          {recipe.categories.length > 0 && (
            <Text style={styles.exportCategories}>{recipe.categories.join(' • ')}</Text>
          )}
          {recipe.photo && (
            <Image source={{ uri: recipe.photo }} style={styles.exportPhoto} />
          )}
          {recipe.ingredients.length > 0 && (
            <>
              <Text style={styles.exportSectionTitle}>Ingredients</Text>
              {recipe.ingredients.map((ing, i) => (
                <Text key={i} style={styles.exportItem}>
                  •  {`${ing.amount} ${ing.unit} ${ing.name}`.trim()}
                </Text>
              ))}
            </>
          )}
          {recipe.tools.length > 0 && (
            <>
              <Text style={styles.exportSectionTitle}>Tools</Text>
              {recipe.tools.map((tool, i) => (
                <Text key={i} style={styles.exportItem}>•  {tool}</Text>
              ))}
            </>
          )}
          {recipe.steps.length > 0 && (
            <>
              <Text style={styles.exportSectionTitle}>Steps</Text>
              {recipe.steps.map((step, i) => (
                <Text key={i} style={styles.exportItem}>{i + 1}. {step}</Text>
              ))}
            </>
          )}
          {recipe.notes ? (
            <>
              <Text style={styles.exportSectionTitle}>Notes</Text>
              <Text style={styles.exportItem}>{recipe.notes}</Text>
            </>
          ) : null}
          <Text style={styles.exportFooter}>NoteCook</Text>
        </View>
      </View>

      {/* ── Floating unit converter button ── */}
      <TouchableOpacity
        style={styles.converterFab}
        onPress={() => setConverterVisible(true)}
      >
        <Ionicons name="swap-horizontal" size={24} color={theme.colors.headerText} />
      </TouchableOpacity>

      {/* ── Unit converter floating card ── */}
      <Modal visible={converterVisible} transparent animationType="fade">
        <Pressable style={styles.converterOverlay} onPress={() => setConverterVisible(false)}>
          <Pressable style={styles.converterCard} onPress={() => {}}>
            <View style={styles.converterCardHeader}>
              <Text style={styles.converterCardTitle}>Unit Converter</Text>
              <TouchableOpacity onPress={() => setConverterVisible(false)}>
                <Ionicons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <UnitConverter />
            </ScrollView>
          </Pressable>
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

  // Hidden card captured for PNG export
  exportCardWrap: {
    position: 'absolute',
    top: 0,
    left: -2000,
    width: 360,
  },
  exportCard: {
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  exportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.buttonPrimary,
    marginBottom: 4,
  },
  exportCategories: {
    fontSize: 13,
    color: theme.colors.tabInactive,
    marginBottom: 12,
  },
  exportPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: theme.colors.secondary,
  },
  exportSectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.buttonSecondary,
    marginTop: 16,
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.secondary,
    paddingBottom: 4,
  },
  exportItem: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  exportFooter: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: theme.colors.tabInactive,
  },

  // Unit converter FAB + floating card
  converterFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.buttonPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  converterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  converterCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  converterCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  converterCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});