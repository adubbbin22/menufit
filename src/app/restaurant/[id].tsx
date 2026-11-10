import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DishSheet } from '@/components/dish-sheet';
import { Button, Card, Chip, H1, H2, MacroPills, Notice, Screen, Sub, VerdictBadge } from '@/components/ui';
import { describeConfidence } from '@/lib/confidence';
import { confirm } from '@/lib/confirm';
import { buildMeals, totalOf } from '@/lib/meals';
import { mealBudget, rankItems, type RankedItem } from '@/lib/scoring';
import { findRestaurant, useStore } from '@/lib/store';
import { colors, radius } from '@/lib/theme';
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
  const [picked, setPicked] = useState<string[]>([]);

  const restaurant = findRestaurant(id, saved);
  const ranked = useMemo(
    () => (restaurant ? rankItems(restaurant.items, profile, targets, left.calories) : []),
    [restaurant, profile, targets, left.calories],
  );

  const meals = useMemo(
    () => (restaurant ? buildMeals(restaurant.items, profile, targets, left.calories) : []),
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

  const conf = describeConfidence(restaurant);
  const confColor = conf.level === 'high' ? colors.primary : conf.level === 'medium' ? colors.carbs : conf.level === 'low' ? colors.accent : colors.faint;
  const bars = conf.level === 'high' ? 3 : conf.level === 'medium' ? 2 : conf.level === 'low' ? 1 : 0;

  const chosen = restaurant.items.filter((i) => picked.includes(i.id));
  const chosenTotal = totalOf(chosen);
  const toggle = (itemId: string) => setPicked((p) => (p.includes(itemId) ? p.filter((x) => x !== itemId) : [...p, itemId]));
  const logAll = (items: typeof chosen) => {
    items.forEach((i) => logItem(restaurant.name, i));
    setLogged(items.map((i) => i.name).join(' + '));
    setPicked([]);
  };

  const remove = () =>
    confirm('Remove restaurant', `Remove ${restaurant.name} from your list?`, 'Remove', () => {
      router.back();
      removeRestaurant(restaurant.id);
    });

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
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
        <View style={s.conf} accessibilityLabel={`${conf.label}. ${conf.note}`}>
          <View style={s.meter}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={[s.meterBar, { height: 6 + n * 5, backgroundColor: n <= bars ? confColor : colors.line }]} />
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.confLabel, { color: confColor }]}>{conf.label}</Text>
            <Sub>{conf.note}</Sub>
          </View>
        </View>

        <Button label="Ask about this menu" icon="chatbubble-ellipses-outline" variant="secondary" onPress={() => router.push(`/ask/${restaurant.id}`)} />

        {meals.length > 0 ? (
          <View style={{ gap: 10 }}>
            <H2>Your best orders here</H2>
            {meals.map((m, i) => (
              <Card key={m.id}>
                <View style={s.mealHead}>
                  <Text style={s.rank}>{i + 1}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    {m.items.map((it) => (
                      <Text key={it.id} style={s.name}>
                        {it.name}
                      </Text>
                    ))}
                  </View>
                  <VerdictBadge fit={m.fit} compact />
                </View>
                <Sub>{Math.round(m.totals.calories)} kcal in total</Sub>
                <MacroPills item={m.totals} />
                {m.howToOrder.map((h) => (
                  <View key={h} style={s.how}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Sub style={{ flex: 1, color: colors.ink }}>{h}</Sub>
                  </View>
                ))}
                <Button label="Log this order" icon="add-circle-outline" variant="secondary" onPress={() => logAll(m.items)} />
              </Card>
            ))}
          </View>
        ) : null}

        <H2>Full menu</H2>
        <Sub>Tap a dish for details, or use + to build your own order.</Sub>
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
                    <View style={{ alignItems: 'flex-end', gap: 10 }}>
                      <VerdictBadge fit={r.fit} compact />
                      <Pressable
                        onPress={() => toggle(r.item.id)}
                        hitSlop={10}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: picked.includes(r.item.id) }}
                        accessibilityLabel={`Add ${r.item.name} to my order`}>
                        <Ionicons name={picked.includes(r.item.id) ? 'checkmark-circle' : 'add-circle-outline'} size={30} color={picked.includes(r.item.id) ? colors.primary : colors.faint} />
                      </Pressable>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {chosen.length > 0 ? (
        <View style={s.tray}>
          <View style={{ flex: 1 }}>
            <Text style={s.trayTitle}>
              {chosen.length} {chosen.length === 1 ? 'item' : 'items'} · {Math.round(chosenTotal.calories)} kcal
            </Text>
            <MacroPills item={chosenTotal} />
            <Sub>{left.calories - chosenTotal.calories >= 0 ? `Leaves ${Math.round(left.calories - chosenTotal.calories)} kcal today` : `${Math.round(chosenTotal.calories - left.calories)} kcal over today's target`}</Sub>
          </View>
          <View style={{ gap: 8 }}>
            <Button label="Healthify" icon="sparkles" variant="secondary" onPress={() => router.push({ pathname: '/healthify', params: { order: chosen.map((i) => i.name).join('\n') } })} style={s.trayBtn} />
            <Button label="Log" icon="add" onPress={() => logAll(chosen)} style={s.trayBtn} />
          </View>
        </View>
      ) : null}

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
  conf: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  meter: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 22 },
  meterBar: { width: 6, borderRadius: 2 },
  confLabel: { fontSize: 14, fontWeight: '800' },
  mealHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, color: colors.primary, textAlign: 'center', lineHeight: 28, fontWeight: '800', overflow: 'hidden' },
  how: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  tray: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  trayTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  trayBtn: { minHeight: 40, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
