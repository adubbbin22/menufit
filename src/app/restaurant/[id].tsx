import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DishSheet } from '@/components/dish-sheet';
import { Button, Card, Chip, H1, H2, MacroPills, Notice, Screen, Sub, VerdictBadge } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { mealBudget, rankItems, type RankedItem } from '@/lib/scoring';
import { findRestaurant, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { useDay } from '@/lib/use-day';

type Filter = 'all' | 'best' | 'protein' | 'light';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'best', label: 'Best picks' },
  { id: 'protein', label: 'High protein' },
  { id: 'light', label: 'Under 500 kcal' },
];

const SECTIONS = [
  { key: 'great', title: 'Best picks for you' },
  { key: 'good', title: 'Solid choices' },
  { key: 'careful', title: 'Go easy' },
  { key: 'skip', title: 'Skip these' },
  { key: 'conflict', title: 'Does not fit your diet' },
] as const;

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const saved = useStore((s) => s.saved);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const removeRestaurant = useStore((s) => s.removeRestaurant);
  const logItem = useStore((s) => s.logItem);
  const { profile, targets, left } = useDay();
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<RankedItem | null>(null);
  const [logged, setLogged] = useState<string | null>(null);

  const restaurant = findRestaurant(id, saved);
  const ranked = useMemo(
    () => (restaurant ? rankItems(restaurant.items, profile, targets, left.calories) : []),
    [restaurant, profile, targets, left.calories],
  );

  if (!restaurant) {
    return (
      <Screen>
        <H1>Restaurant not found</H1>
        <Button label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const shown = ranked.filter(({ item, fit }) => {
    if (filter === 'best') return !fit.conflict && fit.score >= 55;
    if (filter === 'protein') return item.protein >= 30;
    if (filter === 'light') return item.calories < 500;
    return true;
  });
  const fav = favorites.includes(restaurant.id);
  const estimated = restaurant.source !== 'sample';
  const budget = Math.round(mealBudget(targets, left.calories) / 10) * 10;

  const remove = () =>
    confirm('Remove restaurant', `Remove ${restaurant.name} from your list?`, 'Remove', () => {
      router.back();
      removeRestaurant(restaurant.id);
    });

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1 }} />
          {restaurant.source !== 'sample' ? (
            <Pressable onPress={remove} hitSlop={12} accessibilityRole="button" accessibilityLabel="Remove restaurant">
              <Ionicons name="trash-outline" size={24} color={colors.sub} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => toggleFavorite(restaurant.id)} hitSlop={12} accessibilityRole="button" accessibilityLabel={fav ? 'Remove from favorites' : 'Add to favorites'}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={26} color={fav ? colors.accent : colors.sub} />
          </Pressable>
        </View>

        <View>
          <H1>
            {restaurant.emoji} {restaurant.name}
          </H1>
          <Sub>{restaurant.blurb ?? restaurant.cuisine}</Sub>
        </View>

        <Notice icon="flag-outline">
          Aim for about {budget} kcal this meal. You have {Math.max(0, Math.round(left.calories))} kcal and {Math.max(0, Math.round(left.protein))} g
          protein left today.
        </Notice>
        {logged ? (
          <Notice icon="checkmark-circle-outline">Logged {logged}. Rankings now reflect what is left in your day.</Notice>
        ) : null}
        {estimated ? (
          <Notice tone="warn" icon="alert-circle-outline">
            Nutrition for this menu is estimated. Treat the numbers as a guide.
          </Notice>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
          {FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
          ))}
        </ScrollView>

        {shown.length === 0 ? <Sub>No dishes match this filter.</Sub> : null}
        {SECTIONS.map((sec) => {
          const rows = shown.filter(({ fit }) => (sec.key === 'conflict' ? fit.conflict : !fit.conflict && fit.verdict === sec.key));
          if (rows.length === 0) return null;
          return (
            <View key={sec.key} style={{ gap: 10 }}>
              <H2>{sec.title}</H2>
              {rows.map((r) => (
                <Pressable key={r.item.id} accessibilityRole="button" onPress={() => setOpen(r)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                  <Card style={s.row}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.name}>{r.item.name}</Text>
                      <Sub>
                        {r.item.calories} kcal · {r.item.category}
                      </Sub>
                      <MacroPills item={r.item} />
                      <Sub style={{ color: r.fit.conflict ? colors.danger : colors.sub }}>{r.fit.reasons[0]}</Sub>
                    </View>
                    <VerdictBadge fit={r.fit} compact />
                  </Card>
                </Pressable>
              ))}
            </View>
          );
        })}
      </ScrollView>

      <DishSheet
        ranked={open}
        restaurantName={restaurant.name}
        left={left}
        estimated={estimated}
        onClose={() => setOpen(null)}
        onLog={() => {
          if (!open) return;
          logItem(restaurant.name, open.item);
          setLogged(open.item.name);
          setOpen(null);
        }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  filters: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
