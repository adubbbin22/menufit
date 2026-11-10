import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { ActivityPicker, BodyFields, DietPicker, GoalPicker, bodyError } from '@/components/profile-fields';
import { Body, Button, Card, Field, H1, Screen, Sub } from '@/components/ui';
import { computeTargets } from '@/lib/nutrition';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { Profile } from '@/lib/types';

const START: Profile = {
  name: '',
  goal: 'lose',
  sex: 'female',
  age: 30,
  heightCm: 168,
  weightKg: 70,
  activity: 'light',
  diet: 'none',
  avoid: [],
  units: 'imperial',
};

const STEPS = ['welcome', 'goal', 'body', 'activity', 'diet', 'plan'] as const;

export default function Onboarding() {
  const setProfile = useStore((s) => s.setProfile);
  const [draft, setDraft] = useState<Profile>(START);
  const [step, setStep] = useState(0);
  const change = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));

  const id = STEPS[step];
  const error = id === 'body' ? bodyError(draft) : null;
  const targets = computeTargets(draft);
  const last = step === STEPS.length - 1;

  const next = () => (last ? setProfile({ ...draft, name: draft.name.trim() }) : setStep(step + 1));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        edges={['top', 'bottom']}
        footer={
          <View style={s.footer}>
            {error ? <Sub style={{ color: colors.danger }}>{error}</Sub> : null}
            <View style={s.footerRow}>
              {step > 0 ? <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
              <Button
                label={last ? 'Start eating out smarter' : step === 0 ? 'Get started' : 'Continue'}
                onPress={next}
                disabled={!!error}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        }>
        <View style={s.dots} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((x, i) => (
            <View key={x} style={[s.dot, i <= step && s.dotOn]} />
          ))}
        </View>

        {id === 'welcome' && (
          <>
            <View style={s.logo}>
              <Ionicons name="restaurant" size={34} color="#fff" />
            </View>
            <H1>Order well, anywhere.</H1>
            <Body style={{ color: colors.sub }}>
              Tablewise ranks every dish on a menu against your goals, so you know what to order, what to tweak and what to skip before the server
              comes back.
            </Body>
            <Field label="What should we call you? (optional)" value={draft.name} onChangeText={(name) => change({ name })} placeholder="First name" maxLength={30} autoCapitalize="words" />
          </>
        )}
        {id === 'goal' && (
          <>
            <H1>What is your goal?</H1>
            <Sub>This sets your daily calories and how much protein to aim for.</Sub>
            <GoalPicker value={draft.goal} onChange={change} />
          </>
        )}
        {id === 'body' && (
          <>
            <H1>About you</H1>
            <Sub>Used once to estimate how much energy you burn. It stays on this device.</Sub>
            <BodyFields profile={draft} onChange={change} />
          </>
        )}
        {id === 'activity' && (
          <>
            <H1>How active are you?</H1>
            <ActivityPicker value={draft.activity} onChange={change} />
          </>
        )}
        {id === 'diet' && (
          <>
            <H1>Food preferences</H1>
            <Sub>Dishes that break these are flagged and never recommended.</Sub>
            <DietPicker diet={draft.diet} avoid={draft.avoid} dislikes={draft.dislikes} onChange={change} />
          </>
        )}
        {id === 'plan' && (
          <>
            <H1>{draft.name.trim() ? `${draft.name.trim()}, here is your plan` : 'Here is your plan'}</H1>
            <Card>
              <Text style={s.kcal}>{targets.calories}</Text>
              <Sub>calories a day</Sub>
              <View style={s.macros}>
                {(
                  [
                    ['Protein', targets.protein, colors.protein],
                    ['Carbs', targets.carbs, colors.carbs],
                    ['Fat', targets.fat, colors.fat],
                  ] as const
                ).map(([k, v, c]) => (
                  <View key={k} style={s.macro}>
                    <Text style={[s.macroValue, { color: c }]}>{v} g</Text>
                    <Sub>{k}</Sub>
                  </View>
                ))}
              </View>
            </Card>
            <Sub>
              Estimated with the Mifflin-St Jeor equation. You can change these any time in Profile. Tablewise gives general guidance, not medical
              advice; talk to a clinician about medical conditions, pregnancy or a history of disordered eating.
            </Sub>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  footer: { padding: 20, paddingTop: 8, gap: 8 },
  footerRow: { flexDirection: 'row', gap: 8 },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  dotOn: { backgroundColor: colors.primary },
  logo: { width: 68, height: 68, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  kcal: { fontSize: 52, fontWeight: '800', color: colors.ink, letterSpacing: -1.5 },
  macros: { flexDirection: 'row', marginTop: 8 },
  macro: { flex: 1 },
  macroValue: { fontSize: 20, fontWeight: '800' },
});
