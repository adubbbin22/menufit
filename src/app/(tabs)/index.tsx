import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, H1, H2, MacroBar, MacroPills, Ring, Screen, Sub, VerdictBadge, type IconName } from '@/components/ui';
import { CATALOG } from '@/lib/catalog';
import { estimateDish } from '@/lib/estimate';
import { dateKey } from '@/lib/nutrition';
import { rankItems } from '@/lib/scoring';
import { useStore } from '@/lib/store';
import { colors, radius } from '@/lib/theme';
import { useDay } from '@/lib/use-day';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Today() {
  const router = useRouter();
  const { profile, entries, targets, eaten, left } = useDay();
  const removeEntry = useStore((s) => s.removeEntry);
  const saved = useStore((s) => s.saved);
  const log = useStore((s) => s.log);
  const logItem = useStore((s) => s.logItem);
  const [meal, setMeal] = useState('');
  const [kcal, setKcal] = useState('');

  // Calories for each of the last seven days, oldest first.
  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = dateKey(d);
      const total = log.filter((e) => e.date === key).reduce((n, e) => n + e.calories, 0);
      return { key, label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), total };
    });
  }, [log]);

  const manualKcal = Math.round(Number(kcal));
  const kcalValid = kcal.trim() === '' || (manualKcal > 0 && manualKcal <= 5000);
  const addMeal = () => {
    const est = estimateDish(meal);
    // A typed calorie figure wins; macros are scaled from the estimate to match it.
    const f = kcal.trim() !== '' && est.calories > 0 ? manualKcal / est.calories : 1;
    logItem('Added manually', {
      ...est,
      id: 'manual',
      calories: Math.round(est.calories * f),
      protein: Math.round(est.protein * f),
      carbs: Math.round(est.carbs * f),
      fat: Math.round(est.fat * f),
    });
    setMeal('');
    setKcal('');
  };

  // The three best mains across everything the user can browse, for what is left today.
  const picks = useMemo(() => {
    return [...saved, ...CATALOG]
      .flatMap((r) =>
        rankItems(
          r.items.filter((i) => !/drink|side|dessert|starter/i.test(i.category)),
          profile,
          targets,
          left.calories,
        )
          .slice(0, 1)
          .map((x) => ({ ...x, restaurant: r })),
      )
      .filter((x) => !x.fit.conflict)
      .sort((a, b) => b.fit.score - a.fit.score)
      .slice(0, 3);
  }, [saved, profile, targets, left.calories]);

  const over = left.calories < 0;
  const actions: { label: string; icon: IconName; go: () => void }[] = [
    { label: 'Find a restaurant', icon: 'search', go: () => router.push('/explore') },
    { label: 'Scan a menu', icon: 'scan', go: () => router.push('/scan') },
    { label: 'Healthify my order', icon: 'sparkles', go: () => router.push('/healthify') },
  ];

  return (
    <Screen>
      <View>
        <Sub>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Sub>
        <H1>{profile.name ? `${greeting()}, ${profile.name}` : greeting()}</H1>
      </View>

      <Card>
        <View style={s.summary}>
          <Ring progress={eaten.calories / targets.calories} color={over ? colors.danger : colors.primary}>
            <Text style={[s.big, over && { color: colors.danger }]}>{Math.abs(Math.round(left.calories))}</Text>
            <Sub>{over ? 'kcal over' : 'kcal left'}</Sub>
          </Ring>
          <View style={s.summarySide}>
            <View>
              <Text style={s.num}>{Math.round(eaten.calories)}</Text>
              <Sub>eaten</Sub>
            </View>
            <View>
              <Text style={s.num}>{targets.calories}</Text>
              <Sub>daily target</Sub>
            </View>
          </View>
        </View>
        <View style={s.bars}>
          <MacroBar label="Protein" value={eaten.protein} target={targets.protein} color={colors.protein} />
          <MacroBar label="Carbs" value={eaten.carbs} target={targets.carbs} color={colors.carbs} />
          <MacroBar label="Fat" value={eaten.fat} target={targets.fat} color={colors.fat} />
        </View>
      </Card>

      <View style={s.actions}>
        {actions.map((a) => (
          <Pressable key={a.label} onPress={a.go} accessibilityRole="button" style={({ pressed }) => [s.action, pressed && { opacity: 0.7 }]}>
            <View style={s.actionIcon}>
              <Ionicons name={a.icon} size={20} color={colors.primary} />
            </View>
            <Text style={s.actionText}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <H2>Good orders right now</H2>
      {picks.map(({ item, fit, restaurant }) => (
        <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push(`/restaurant/${restaurant.id}`)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Card style={s.pick}>
            <Text style={s.emoji}>{restaurant.emoji}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.itemName}>{item.name}</Text>
              <Sub>
                {restaurant.name} · {item.calories} kcal
              </Sub>
              <MacroPills item={item} />
            </View>
            <VerdictBadge fit={fit} compact />
          </Card>
        </Pressable>
      ))}

      <H2>This week</H2>
      <Card>
        <View style={s.week} accessibilityLabel="Calories logged over the last seven days">
          {week.map((d) => {
            const pct = Math.min(1, d.total / targets.calories);
            return (
              <View key={d.key} style={s.day} accessibilityLabel={`${d.key}: ${Math.round(d.total)} kcal`}>
                <View style={s.dayTrack}>
                  <View style={[s.dayFill, { height: `${pct * 100}%`, backgroundColor: d.total > targets.calories ? colors.danger : colors.primary }]} />
                </View>
                <Text style={s.dayLabel}>{d.label}</Text>
              </View>
            );
          })}
        </View>
        <Sub>Bars fill toward your {targets.calories} kcal target; red means over.</Sub>
      </Card>

      <H2>Ate something else?</H2>
      <Card>
        <Field value={meal} onChangeText={setMeal} placeholder="e.g. Chicken burrito bowl" accessibilityLabel="Meal name" maxLength={80} />
        <Field value={kcal} onChangeText={setKcal} placeholder="Calories (optional, estimated if empty)" accessibilityLabel="Calories" keyboardType="number-pad" maxLength={4} />
        {!kcalValid ? <Sub style={{ color: colors.danger }}>Enter calories between 1 and 5000, or leave it empty.</Sub> : null}
        <Button label="Add to today" icon="add" variant="secondary" onPress={addMeal} disabled={meal.trim().length < 2 || !kcalValid} />
      </Card>

      <H2>Today's log</H2>
      {entries.length === 0 ? (
        <Card>
          <Sub>Nothing logged yet. Open a restaurant, pick a dish and tap "Log this meal".</Sub>
        </Card>
      ) : (
        entries.map((e) => (
          <Card key={e.id} style={s.pick}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.itemName}>{e.itemName}</Text>
              <Sub>
                {e.restaurantName} · {e.calories} kcal
              </Sub>
              <MacroPills item={e} />
            </View>
            <Pressable onPress={() => removeEntry(e.id)} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Remove ${e.itemName}`}>
              <Ionicons name="trash-outline" size={20} color={colors.faint} />
            </Pressable>
          </Card>
        ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  summarySide: { flex: 1, gap: 14 },
  big: { fontSize: 34, fontWeight: '800', color: colors.ink, letterSpacing: -1 },
  num: { fontSize: 22, fontWeight: '800', color: colors.ink },
  bars: { gap: 12, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, gap: 10, minHeight: 96 },
  actionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  week: { flexDirection: 'row', gap: 8, height: 96 },
  day: { flex: 1, alignItems: 'center', gap: 6 },
  dayTrack: { flex: 1, width: '100%', borderRadius: 6, backgroundColor: colors.line, justifyContent: 'flex-end', overflow: 'hidden' },
  dayFill: { width: '100%', borderRadius: 6 },
  dayLabel: { fontSize: 12, fontWeight: '700', color: colors.sub },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 28 },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.ink },
});
