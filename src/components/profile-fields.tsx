import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from '@/lib/nutrition';
import type { Activity, Allergen, Diet, Goal, Profile, Sex, Units } from '@/lib/types';
import { Chip, Field, Option, Sub, type IconName } from './ui';

type Change = (patch: Partial<Profile>) => void;

const GOALS: { id: Goal; title: string; detail: string; icon: IconName }[] = [
  { id: 'lose', title: 'Lose fat', detail: 'A steady calorie deficit, high protein', icon: 'trending-down' },
  { id: 'maintain', title: 'Stay where I am', detail: 'Eat well without tracking every bite', icon: 'remove' },
  { id: 'gain', title: 'Build muscle', detail: 'A small surplus with plenty of protein', icon: 'trending-up' },
];

export function GoalPicker({ value, onChange }: { value: Goal; onChange: Change }) {
  return (
    <View style={s.stack} accessibilityRole="radiogroup">
      {GOALS.map((g) => (
        <Option key={g.id} title={g.title} detail={g.detail} icon={g.icon} selected={value === g.id} onPress={() => onChange({ goal: g.id })} />
      ))}
    </View>
  );
}

const ACTIVITIES: { id: Activity; title: string; detail: string }[] = [
  { id: 'sedentary', title: 'Mostly sitting', detail: 'Desk job, little exercise' },
  { id: 'light', title: 'Lightly active', detail: 'Exercise 1-3 days a week' },
  { id: 'moderate', title: 'Active', detail: 'Exercise 3-5 days a week' },
  { id: 'active', title: 'Very active', detail: 'Hard training or a physical job' },
];

export function ActivityPicker({ value, onChange }: { value: Activity; onChange: Change }) {
  return (
    <View style={s.stack} accessibilityRole="radiogroup">
      {ACTIVITIES.map((a) => (
        <Option key={a.id} title={a.title} detail={a.detail} selected={value === a.id} onPress={() => onChange({ activity: a.id })} />
      ))}
    </View>
  );
}

const DIETS: { id: Diet; label: string }[] = [
  { id: 'none', label: 'No restrictions' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'lowcarb', label: 'Low-carb' },
  { id: 'keto', label: 'Keto' },
];

const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: 'gluten', label: 'Gluten' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'nuts', label: 'Nuts' },
  { id: 'shellfish', label: 'Shellfish' },
  { id: 'fish', label: 'Fish' },
  { id: 'egg', label: 'Egg' },
  { id: 'soy', label: 'Soy' },
];

export function DietPicker({ diet, avoid, dislikes, onChange }: { diet: Diet; avoid: Allergen[]; dislikes?: string[]; onChange: Change }) {
  const [text, setText] = useState((dislikes ?? []).join(', '));
  const toggle = (a: Allergen) => onChange({ avoid: avoid.includes(a) ? avoid.filter((x) => x !== a) : [...avoid, a] });
  return (
    <View style={s.stack}>
      <Sub>How you eat</Sub>
      <View style={s.wrap}>
        {DIETS.map((d) => (
          <Chip key={d.id} label={d.label} selected={diet === d.id} onPress={() => onChange({ diet: d.id })} />
        ))}
      </View>
      <Sub style={{ marginTop: 8 }}>Anything to avoid</Sub>
      <View style={s.wrap}>
        {ALLERGENS.map((a) => (
          <Chip key={a.id} label={a.label} selected={avoid.includes(a.id)} onPress={() => toggle(a.id)} />
        ))}
      </View>
      <Sub style={{ marginTop: 8 }}>Foods you dislike</Sub>
      <Field
        value={text}
        onChangeText={(t) => {
          setText(t);
          onChange({ dislikes: t.split(',').map((x) => x.trim()).filter((x) => x.length >= 3).slice(0, 12) });
        }}
        placeholder="e.g. mushrooms, olives, cilantro"
        accessibilityLabel="Foods you dislike"
        autoCapitalize="none"
        maxLength={160}
      />
    </View>
  );
}

const num = (t: string) => {
  const n = parseFloat(t.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

/** Sex, age, height and weight. Values are stored metric; inputs follow the chosen units. */
export function BodyFields({ profile, onChange }: { profile: Profile; onChange: Change }) {
  const imp = cmToFtIn(profile.heightCm);
  const [age, setAge] = useState(String(profile.age));
  const [cm, setCm] = useState(String(Math.round(profile.heightCm)));
  const [ft, setFt] = useState(String(imp.ft));
  const [inch, setInch] = useState(String(imp.inch));
  const [kg, setKg] = useState(String(Math.round(profile.weightKg)));
  const [lb, setLb] = useState(String(Math.round(kgToLb(profile.weightKg))));

  const setUnits = (units: Units) => {
    // Re-derive the other system's fields from the stored metric values.
    const i = cmToFtIn(profile.heightCm);
    setFt(String(i.ft));
    setInch(String(i.inch));
    setCm(String(Math.round(profile.heightCm)));
    setKg(String(Math.round(profile.weightKg)));
    setLb(String(Math.round(kgToLb(profile.weightKg))));
    onChange({ units });
  };

  return (
    <View style={s.stack}>
      <View style={s.wrap}>
        {(['female', 'male'] as Sex[]).map((x) => (
          <Chip key={x} label={x === 'female' ? 'Female' : 'Male'} selected={profile.sex === x} onPress={() => onChange({ sex: x })} />
        ))}
        <View style={{ flex: 1 }} />
        <Chip label="ft / lb" selected={profile.units === 'imperial'} onPress={() => setUnits('imperial')} />
        <Chip label="cm / kg" selected={profile.units === 'metric'} onPress={() => setUnits('metric')} />
      </View>
      <Sub>Sex is used only for the energy formula.</Sub>
      <Field label="Age" keyboardType="number-pad" value={age} maxLength={3} onChangeText={(t) => { setAge(t); onChange({ age: Math.round(num(t)) }); }} />
      {profile.units === 'imperial' ? (
        <>
          <View style={s.row}>
            <Field label="Height (ft)" keyboardType="number-pad" value={ft} maxLength={1} onChangeText={(t) => { setFt(t); onChange({ heightCm: ftInToCm(num(t), num(inch)) }); }} />
            <Field label="(in)" keyboardType="number-pad" value={inch} maxLength={2} onChangeText={(t) => { setInch(t); onChange({ heightCm: ftInToCm(num(ft), num(t)) }); }} />
          </View>
          <Field label="Weight (lb)" keyboardType="decimal-pad" value={lb} maxLength={5} onChangeText={(t) => { setLb(t); onChange({ weightKg: lbToKg(num(t)) }); }} />
        </>
      ) : (
        <>
          <Field label="Height (cm)" keyboardType="number-pad" value={cm} maxLength={3} onChangeText={(t) => { setCm(t); onChange({ heightCm: num(t) }); }} />
          <Field label="Weight (kg)" keyboardType="decimal-pad" value={kg} maxLength={5} onChangeText={(t) => { setKg(t); onChange({ weightKg: num(t) }); }} />
        </>
      )}
    </View>
  );
}

/** Returns a message when the body numbers are unusable, otherwise null. */
export function bodyError(p: Profile): string | null {
  if (!(p.age >= 18 && p.age <= 100)) return 'Enter an age between 18 and 100. This app is for adults.';
  if (!(p.heightCm >= 120 && p.heightCm <= 230)) return 'That height looks off. Please check it.';
  if (!(p.weightKg >= 35 && p.weightKg <= 300)) return 'That weight looks off. Please check it.';
  return null;
}

const s = StyleSheet.create({
  stack: { gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 12 },
});
