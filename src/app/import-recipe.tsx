// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { theme } from '../constants/theme';

const BUNDLED_SPOONACULAR_KEY = '7205ff6e1db94e5b8b9849ea8808f280';

export default function ImportRecipeScreen() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleImport() {
        if (!url.trim()) return;
        setLoading(true);
        setError('');

        try {
            // Use personal key if available, otherwise use bundled key
            const personalKey = await AsyncStorage.getItem('notecook_spoonacular_key');
            const apiKey = personalKey || BUNDLED_SPOONACULAR_KEY;

            // Extract recipe via Spoonacular
            const response = await fetch(
                `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(url.trim())}&apiKey=${apiKey}`
            );
            const data = await response.json();
            console.log('Spoonacular response:', JSON.stringify(data));
            console.log('Title:', data.title);
            console.log('Instructions:', data.instructions);
            console.log('Analyzed:', JSON.stringify(data.analyzedInstructions));
            console.log('Equipment:', JSON.stringify(data.analyzedInstructions?.[0]?.steps?.map(s => s.equipment)));

            // Check for quota exceeded
            if (data.code === 402) {
                if (!personalKey) {
                    setError('Daily import limit reached. Please add your own Spoonacular API key in Settings to continue.');
                } else {
                    setError('Your Spoonacular API key has reached its daily limit. Please try again tomorrow.');
                }
                setLoading(false);
                return;
            }

            if (!data.title) throw new Error('Could not extract recipe');

            // Map Spoonacular response to our recipe format
            let recipe = {
                title: data.title ?? '',
                categories: data.dishTypes ?? [],
                ingredients: (data.extendedIngredients ?? []).map((ing) => ({
                    amount: ing.amount?.toString() ?? '',
                    unit: ing.unit ?? '',
                    name: ing.name ?? '',
                })),
                tools: [...new Set(
                    (data.analyzedInstructions?.[0]?.steps ?? [])
                        .flatMap((s) => (s.equipment ?? []).map((e) => e.name))
                )],
                steps: (data.analyzedInstructions?.[0]?.steps ?? []).map((s) => s.step),
                notes: data.sourceName ? `Source: ${data.sourceName}` : '',
                photo: data.image ?? null,
            };

            // Step 3: Groq enrichment if key is available
            const groqKey = await AsyncStorage.getItem('notecook_groq_key');
            if (groqKey) {
                try {
                    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${groqKey}`,
                        },
                        body: JSON.stringify({
                            model: 'groq/compound-mini',
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are a recipe formatting assistant. Given a partially extracted recipe, clean it up and fill in any missing details. Return ONLY a valid JSON object with NO extra text or markdown. Use this exact structure:
{
  "title": "Recipe name",
  "categories": ["category1"],
  "ingredients": [{ "amount": "1", "unit": "cup", "name": "flour" }],
  "tools": ["tool1", "tool2"],
  "steps": ["Step 1", "Step 2"],
  "notes": "Any tips"
}
Fix awkward phrasing, infer missing tools from steps, ensure steps are clear and complete. Return ONLY JSON.`
                                },
                                {
                                    role: 'user',
                                    content: `Clean up and enrich this recipe:\n${JSON.stringify(recipe)}`
                                }
                            ],
                            max_tokens: 1500,
                            temperature: 0.3,
                        })
                    });

                    const groqData = await groqResponse.json();
                    console.log('Groq response:', JSON.stringify(groqData));
                    const groqText = groqData.choices?.[0]?.message?.content?.trim();
                    if (groqText) {
                        const jsonMatch = groqText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const groqRecipe = JSON.parse(jsonMatch[0]);
                            recipe = {
                                ...groqRecipe,
                                photo: recipe.photo, // preserve Spoonacular's image URL
                            };
                            console.log('After Groq photo:', recipe.photo);
                        }
                    }
                } catch (e) {
                    console.log('Groq enrichment failed, using Spoonacular data:', e);
                    // Silently fall back to Spoonacular data
                }
            }

            console.log('Final recipe photo:', recipe.photo);
            // Navigate to new recipe screen with pre-filled data
            router.push({
                pathname: '/new-recipe' as any,
                params: { prefill: JSON.stringify(recipe) }
            });

        } catch (e) {
            console.log('Import error:', e);
            setError('Could not extract recipe. Please check the URL and try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.wrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={theme.colors.headerText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Import from URL</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.label}>Paste a recipe URL</Text>
                <Text style={styles.hint}>
                    Works with most recipe websites. Spoonacular will extract the ingredients, steps and more automatically.
                </Text>

                <View style={styles.inputRow}>
                    <Ionicons name="link" size={18} color={theme.colors.tabInactive} />
                    <TextInput
                        style={styles.input}
                        value={url}
                        onChangeText={setUrl}
                        placeholder="https://..."
                        placeholderTextColor={theme.colors.tabInactive}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                    />
                    {url.length > 0 && (
                        <TouchableOpacity onPress={() => setUrl('')}>
                            <Ionicons name="close-circle" size={18} color={theme.colors.tabInactive} />
                        </TouchableOpacity>
                    )}
                </View>

                {error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : null}

                <TouchableOpacity
                    style={[styles.importBtn, (!url.trim() || loading) && styles.importBtnDisabled]}
                    onPress={handleImport}
                    disabled={!url.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.headerText} />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={20} color={theme.colors.headerText} />
                            <Text style={styles.importBtnText}>Import Recipe</Text>
                        </>
                    )}
                </TouchableOpacity>

                {loading && (
                    <Text style={styles.loadingHint}>
                        Fetching and extracting recipe... this may take a moment.
                    </Text>
                )}
            </View>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.headerText,
    },
    body: {
        flex: 1,
        padding: 24,
        gap: 12,
    },
    label: {
        fontSize: 17,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    hint: {
        fontSize: 13,
        color: theme.colors.text,
        opacity: 0.6,
        lineHeight: 18,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        marginTop: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text,
    },
    error: {
        fontSize: 13,
        color: '#e74c3c',
        marginTop: 4,
    },
    importBtn: {
        backgroundColor: theme.colors.buttonPrimary,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    importBtnDisabled: {
        opacity: 0.5,
    },
    importBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.headerText,
    },
    loadingHint: {
        fontSize: 13,
        color: theme.colors.text,
        opacity: 0.5,
        textAlign: 'center',
        marginTop: 8,
    },
});