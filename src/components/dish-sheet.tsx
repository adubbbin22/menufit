import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/lib/theme';
import type { RankedItem } from '@/lib/scoring';
import type { Targets } from '@/lib/types';
import { Body, Button, H2, Notice, Sub, VerdictBadge } from './ui';

export function DishSheet({
  ranked,
  restaurantName,
  left,
  estimated,
  onClose,
  onLog,
}: {
  ranked: RankedItem | null;
  restaurantName: string;
  left: Targets;
  estimated: boolean;
  onClose: () => void;
  onLog: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!ranked) return null;
  const { item, fit } = ranked;
  const after = Math.round(left.calories - item.calories);

  const stats: [string, string][] = [
    ['Calories', `${item.calories}`],
    ['Protein', `${item.protein} g`],
    ['Carbs', `${item.carbs} g`],
    ['Fat', `${item.fat} g`],
  ];
  const extra: string[] = [];
  if (item.fiber !== undefined) extra.push(`Fiber ${item.fiber} g`);
  if (item.sugar !== undefined) extra.push(`Sugar ${item.sugar} g`);
  if (item.sodium !== undefined) extra.push(`Sodium ${item.sodium} mg`);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.handle} />
          <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <View style={s.head}>
              <View style={{ flex: 1, gap: 4 }}>
                <H2 style={{ fontSize: 22 }}>{item.name}</H2>
                <Sub>
                  {restaurantName} · {item.category}
                </Sub>
              </View>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close-circle" size={30} color={colors.faint} />
              </Pressable>
            </View>
            {item.description ? <Body style={{ color: colors.sub }}>{item.description}</Body> : null}
            <VerdictBadge fit={fit} />

            <View style={s.stats}>
              {stats.map(([k, v]) => (
                <View key={k} style={s.stat}>
                  <Text style={s.statValue}>{v}</Text>
                  <Text style={s.statLabel}>{k}</Text>
                </View>
              ))}
            </View>
            {extra.length ? <Sub>{extra.join('  ·  ')}</Sub> : null}

            <View style={{ gap: 8 }}>
              <H2>Why</H2>
              {fit.reasons.map((r) => (
                <View key={r} style={s.reason}>
                  <Ionicons name={fit.conflict ? 'close-circle' : 'ellipse'} size={fit.conflict ? 18 : 8} color={fit.conflict ? colors.danger : colors.primary} />
                  <Body style={{ flex: 1 }}>{r}</Body>
                </View>
              ))}
            </View>

            {item.tip ? <Notice icon="bulb-outline">{item.tip}</Notice> : null}
            {estimated ? (
              <Notice tone="warn" icon="alert-circle-outline">
                Nutrition here is an estimate from the dish name, not the restaurant's published figures.
              </Notice>
            ) : null}

            <Sub>
              {after >= 0
                ? `Log it and you will have about ${after} kcal left today.`
                : `Logging this puts you about ${Math.abs(after)} kcal over today's target.`}
            </Sub>
            <Button label="Log this meal" icon="add-circle-outline" onPress={onLog} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(24,33,29,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '88%', width: '100%', maxWidth: 560, alignSelf: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: 'center', marginTop: 10 },
  content: { padding: 20, gap: 16 },
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.sm, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.sub, marginTop: 2 },
  reason: { flexDirection: 'row', gap: 10, alignItems: 'center' },
});
