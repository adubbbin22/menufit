import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityPicker, BodyFields, DietPicker, GoalPicker, bodyError } from '@/components/profile-fields';
import { Button, Card, Field, H1, H2, Notice, Screen, Sub } from '@/components/ui';
import { aiEnabled } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import { computeTargets, targetsFor } from '@/lib/nutrition';
import { useProfile, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export default function ProfileScreen() {
  const profile = useProfile();
  const setProfile = useStore((s) => s.setProfile);
  const reset = useStore((s) => s.reset);
  const [draft, setDraft] = useState<Profile>(profile);
  const [custom, setCustom] = useState(profile.customTargets ? String(profile.customTargets.calories) : '');
  const [savedAt, setSavedAt] = useState(0);

  const change = (patch: Partial<Profile>) => setDraft((d) => ({ ...d, ...patch }));
  const error = bodyError(draft);

  // A custom calorie target keeps the computed macro split, scaled to the new total.
  const computed = computeTargets(draft);
  const customKcal = Math.round(Number(custom));
  const customValid = custom.trim() === '' || (customKcal >= 1200 && customKcal <= 6000);
  const next: Profile = {
    ...draft,
    name: draft.name.trim(),
    customTargets:
      custom.trim() !== '' && customValid
        ? {
            calories: customKcal,
            protein: Math.round((computed.protein * customKcal) / computed.calories),
            carbs: Math.round((computed.carbs * customKcal) / computed.calories),
            fat: Math.round((computed.fat * customKcal) / computed.calories),
          }
        : undefined,
  };
  const targets = targetsFor(next);
  const dirty = JSON.stringify(next) !== JSON.stringify(profile);

  return (
    <Screen>
      <H1>Profile</H1>

      <Card>
        <H2>Daily targets</H2>
        <View style={s.targets}>
          {(
            [
              ['kcal', targets.calories, colors.ink],
              ['protein', `${targets.protein} g`, colors.protein],
              ['carbs', `${targets.carbs} g`, colors.carbs],
              ['fat', `${targets.fat} g`, colors.fat],
            ] as const
          ).map(([k, v, c]) => (
            <View key={k} style={{ flex: 1 }}>
              <Text style={[s.value, { color: c }]}>{v}</Text>
              <Sub>{k}</Sub>
            </View>
          ))}
        </View>
        <Field
          label={`Custom calorie target (suggested ${computed.calories})`}
          value={custom}
          onChangeText={setCustom}
          keyboardType="number-pad"
          placeholder="Leave empty to use the suggestion"
          maxLength={4}
        />
        {!customValid ? <Sub style={{ color: colors.danger }}>Enter a value between 1200 and 6000, or leave it empty.</Sub> : null}
      </Card>

      <Card>
        <H2>You</H2>
        <Field label="Name" value={draft.name} onChangeText={(name) => change({ name })} maxLength={30} autoCapitalize="words" />
        <BodyFields profile={draft} onChange={change} />
      </Card>
      <Card>
        <H2>Goal</H2>
        <GoalPicker value={draft.goal} onChange={change} />
      </Card>
      <Card>
        <H2>Activity</H2>
        <ActivityPicker value={draft.activity} onChange={change} />
      </Card>
      <Card>
        <H2>Food preferences</H2>
        <DietPicker diet={draft.diet} avoid={draft.avoid} dislikes={draft.dislikes} onChange={change} />
      </Card>

      {error ? <Sub style={{ color: colors.danger }}>{error}</Sub> : null}
      <Button
        label={dirty ? 'Save changes' : savedAt ? 'Saved' : 'No changes'}
        onPress={() => {
          setProfile(next);
          setDraft(next);
          setSavedAt(Date.now());
        }}
        disabled={!dirty || !!error || !customValid}
      />

      <Notice icon={aiEnabled ? 'cloud-done-outline' : 'cloud-offline-outline'}>
        {aiEnabled
          ? 'AI server connected: restaurant lookup, photo scanning and the open-ended coach are on.'
          : 'Running offline: sample menus, pasted menus, swaps and built-in coaching work on-device. Set EXPO_PUBLIC_API_URL to enable AI lookup and photo scanning.'}
      </Notice>
      <Sub>
        Tablewise offers general nutrition guidance, not medical advice. Allergen flags are best-effort and can be wrong: always confirm with the
        restaurant if you have an allergy.
      </Sub>
      <Button
        label="Erase all my data"
        variant="danger"
        icon="trash-outline"
        onPress={() => confirm('Erase all data', 'This deletes your profile, log, saved restaurants and chat from this device.', 'Erase', reset)}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  targets: { flexDirection: 'row' },
  value: { fontSize: 20, fontWeight: '800' },
});
