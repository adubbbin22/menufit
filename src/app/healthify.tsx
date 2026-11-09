import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, H1, Notice, Screen, Sub } from '@/components/ui';
import { ApiError, aiEnabled, healthifyAi } from '@/lib/api';
import { healthifyLocal } from '@/lib/healthify';
import { colors } from '@/lib/theme';
import type { Swap } from '@/lib/types';
import { useDay } from '@/lib/use-day';

export default function Healthify() {
  const router = useRouter();
  const { profile, user } = useDay();
  const [order, setOrder] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ swaps: Swap[]; tip: string } | null>(null);

  const run = async () => {
    setError(null);
    if (!aiEnabled) {
      setResult(healthifyLocal(order, profile.goal));
      return;
    }
    setBusy(true);
    try {
      setResult(await healthifyAi(order.trim(), user));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const saved = result?.swaps.reduce((n, sw) => n + sw.saves, 0) ?? 0;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={s.top}>
        <H1 style={{ flex: 1 }}>Healthify my order</H1>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close-circle" size={32} color={colors.faint} />
        </Pressable>
      </View>
      <Sub>Tell us what you were going to order. We keep the meal you want and suggest the smallest changes that make it fit.</Sub>
      <Field
        value={order}
        onChangeText={(t) => {
          setOrder(t);
          setResult(null);
        }}
        multiline
        placeholder={'Double bacon cheeseburger\nLarge fries\nCola'}
        style={s.area}
        accessibilityLabel="Your order"
      />
      <Button label="Suggest swaps" icon="sparkles" onPress={run} loading={busy} disabled={order.trim().length < 3} />
      {error ? <Sub style={{ color: colors.danger }}>{error}</Sub> : null}

      {result ? (
        <>
          {result.swaps.length === 0 ? (
            <Notice icon="checkmark-circle-outline">That order already looks sensible. No swaps to suggest.</Notice>
          ) : (
            <Notice icon="trending-down">These swaps save roughly {saved} kcal in total.</Notice>
          )}
          {result.swaps.map((sw, i) => (
            <Card key={`${sw.from}-${i}`}>
              <Sub>Instead of</Sub>
              <Text style={s.from}>{sw.from}</Text>
              <View style={s.toRow}>
                <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
                <Text style={s.to}>{sw.to}</Text>
              </View>
              <Sub>{sw.why}</Sub>
              <Text style={s.saves}>Saves about {sw.saves} kcal</Text>
            </Card>
          ))}
          <Notice icon="bulb-outline">{result.tip}</Notice>
        </>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  area: { minHeight: 120, textAlignVertical: 'top' },
  from: { fontSize: 16, color: colors.sub, textDecorationLine: 'line-through' },
  toRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  to: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  saves: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
