import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, H1, H2, Notice, Screen, Sub } from '@/components/ui';
import { ApiError, aiEnabled, lookupRestaurant } from '@/lib/api';
import { CATALOG } from '@/lib/catalog';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { Restaurant } from '@/lib/types';

const SOURCE_LABEL: Record<Restaurant['source'], string> = {
  sample: 'Sample menu',
  ai: 'AI lookup',
  scan: 'Scanned menu',
  text: 'Pasted menu',
};

export default function Explore() {
  const router = useRouter();
  const saved = useStore((s) => s.saved);
  const favorites = useStore((s) => s.favorites);
  const saveRestaurant = useStore((s) => s.saveRestaurant);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const all = [...saved, ...CATALOG];
    const hits = q
      ? all.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q) || r.items.some((i) => i.name.toLowerCase().includes(q)))
      : all;
    // Favorites float to the top.
    return [...hits].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
  }, [q, saved, favorites]);

  const lookup = async () => {
    setBusy(true);
    setError(null);
    try {
      const menu = await lookupRestaurant(query.trim(), location.trim());
      if (menu.items.length === 0) {
        setError(`No menu found for "${query.trim()}". Try adding a city, or scan the menu instead.`);
        return;
      }
      const id = saveRestaurant({ name: menu.name, cuisine: menu.cuisine, emoji: '🍽️', source: 'ai', items: menu.items });
      setQuery('');
      router.push(`/restaurant/${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <H1>Restaurants</H1>
      <Field value={query} onChangeText={setQuery} placeholder="Search a restaurant, cuisine or dish" returnKeyType="search" autoCorrect={false} accessibilityLabel="Search restaurants" />

      {q.length >= 2 && aiEnabled && (
        <Card>
          <H2>Not in your list?</H2>
          <Sub>Look up "{query.trim()}" anywhere. The AI finds the menu and estimates nutrition for each dish.</Sub>
          <Field value={location} onChangeText={setLocation} placeholder="City or neighborhood (optional)" accessibilityLabel="Location" />
          <Button label={busy ? 'Finding the menu…' : `Look up "${query.trim()}"`} icon="sparkles" onPress={lookup} loading={busy} />
          {error ? <Sub style={{ color: colors.danger }}>{error}</Sub> : null}
        </Card>
      )}
      {q.length >= 2 && !aiEnabled && results.length === 0 && (
        <Notice>
          No match in your saved or sample restaurants. Scan or paste the menu on the Scan tab to rank its dishes, or connect the AI server to look up
          any restaurant by name.
        </Notice>
      )}

      {results.map((r) => (
        <Pressable key={r.id} accessibilityRole="button" onPress={() => router.push(`/restaurant/${r.id}`)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Card style={s.row}>
            <Text style={s.emoji}>{r.emoji}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.name}>{r.name}</Text>
              <Sub>
                {r.cuisine} · {r.items.length} dishes
              </Sub>
              <Sub style={{ color: colors.faint }}>{SOURCE_LABEL[r.source]}</Sub>
            </View>
            {favorites.includes(r.id) ? <Ionicons name="heart" size={18} color={colors.accent} /> : null}
            <Ionicons name="chevron-forward" size={20} color={colors.faint} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 30 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
});
