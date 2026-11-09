import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { VERDICT_LABEL } from '@/lib/scoring';
import { colors, radius, verdictColor } from '@/lib/theme';
import type { Fit, Targets } from '@/lib/types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={s.safe} edges={edges}>
      <View style={s.column}>
        {scroll ? (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={s.fill}>{children}</View>
        )}
        {footer}
      </View>
    </SafeAreaView>
  );
}

export const H1 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.h1, style]} accessibilityRole="header">
    {children}
  </Text>
);
export const H2 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.h2, style]} accessibilityRole="header">
    {children}
  </Text>
);
export const Body = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.body, style]}>{children}</Text>
);
export const Sub = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[s.sub, style]}>{children}</Text>
);

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && s.btnPrimary,
        variant === 'secondary' && s.btnSecondary,
        variant === 'danger' && s.btnDanger,
        (disabled || loading) && s.btnDisabled,
        pressed && s.pressed,
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && s.pressed]}>
      {icon ? <Ionicons name={icon} size={14} color={selected ? '#fff' : colors.sub} /> : null}
      <Text style={[s.chipText, selected && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string }) {
  return (
    <View style={s.fieldWrap}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.faint} style={[s.input, style]} {...props} />
    </View>
  );
}

/** A selectable row used for single-choice questions. */
export function Option({
  title,
  detail,
  icon,
  selected,
  onPress,
}: {
  title: string;
  detail?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [s.option, selected && s.optionOn, pressed && s.pressed]}>
      {icon ? <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.sub} /> : null}
      <View style={s.fill}>
        <Text style={s.optionTitle}>{title}</Text>
        {detail ? <Text style={s.sub}>{detail}</Text> : null}
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={20} color={selected ? colors.primary : colors.faint} />
    </Pressable>
  );
}

export function VerdictBadge({ fit, compact }: { fit: Fit; compact?: boolean }) {
  const c = verdictColor[fit.verdict];
  const label = fit.conflict ? 'Not for you' : VERDICT_LABEL[fit.verdict];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      {!fit.conflict && <Text style={[s.badgeScore, { color: c.fg }]}>{fit.score}</Text>}
      {!compact || fit.conflict ? <Text style={[s.badgeText, { color: c.fg }]}>{label}</Text> : null}
    </View>
  );
}

export function Ring({ progress, size = 150, stroke = 14, color = colors.primary, children }: { progress: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        {p > 0.005 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circ * p} ${circ}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View accessibilityLabel={`${label}: ${Math.round(value)} of ${Math.round(target)} grams`}>
      <View style={s.rowBetween}>
        <Text style={s.macroLabel}>{label}</Text>
        <Text style={s.macroValue}>
          {Math.round(value)}
          <Text style={s.macroTarget}> / {Math.round(target)} g</Text>
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.trackFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function MacroPills({ item }: { item: Pick<Targets, 'protein' | 'carbs' | 'fat'> }) {
  return (
    <Text style={s.sub}>
      <Text style={{ color: colors.protein, fontWeight: '700' }}>P {Math.round(item.protein)}</Text>
      {'  ·  '}
      <Text style={{ color: colors.carbs, fontWeight: '700' }}>C {Math.round(item.carbs)}</Text>
      {'  ·  '}
      <Text style={{ color: colors.fat, fontWeight: '700' }}>F {Math.round(item.fat)}</Text>
    </Text>
  );
}

export function Notice({ children, icon = 'information-circle-outline', tone = 'info' }: { children: ReactNode; icon?: IconName; tone?: 'info' | 'warn' }) {
  const warn = tone === 'warn';
  return (
    <View style={[s.notice, warn && { backgroundColor: colors.accentSoft }]}>
      <Ionicons name={icon} size={18} color={warn ? colors.accent : colors.primary} />
      <Text style={[s.sub, s.fill, { color: colors.ink }]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  fill: { flex: 1 },
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, lineHeight: 23, color: colors.ink },
  sub: { fontSize: 14, lineHeight: 20, color: colors.sub },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.line },
  btn: { minHeight: 50, borderRadius: radius.md, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: colors.primarySoft },
  btnDanger: { backgroundColor: '#F9DDD6' },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.sub },
  chipTextOn: { color: '#fff' },
  fieldWrap: { gap: 6, flexGrow: 1 },
  label: { fontSize: 13, fontWeight: '700', color: colors.sub, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 28, borderRadius: 14, alignSelf: 'flex-start' },
  badgeScore: { fontSize: 14, fontWeight: '800' },
  badgeText: { fontSize: 13, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  macroLabel: { fontSize: 13, fontWeight: '700', color: colors.sub },
  macroValue: { fontSize: 14, fontWeight: '800', color: colors.ink },
  macroTarget: { fontWeight: '500', color: colors.faint },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, marginTop: 6, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4 },
  notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'flex-start' },
});
