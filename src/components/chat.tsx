import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';

import { colors, radius } from '@/lib/theme';
import type { ChatMessage } from '@/lib/types';
import { Chip, H1, Screen, Sub } from './ui';

/** The conversation UI shared by the Coach tab and the per-restaurant chat. */
export function Chat({
  title,
  subtitle,
  messages,
  starters,
  busy,
  onSend,
  onClear,
  onBack,
  edges,
}: {
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  starters: string[];
  busy: boolean;
  onSend: (text: string) => void;
  onClear?: () => void;
  onBack?: () => void;
  edges?: Edge[];
}) {
  const [draft, setDraft] = useState('');
  const list = useRef<FlatList<ChatMessage>>(null);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setDraft('');
    onSend(text);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false} edges={edges}>
        <View style={s.header}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
              <Ionicons name="chevron-back" size={28} color={colors.ink} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <H1 style={onBack ? { fontSize: 22 } : undefined}>{title}</H1>
            <Sub>{subtitle}</Sub>
          </View>
          {onClear && messages.length > 0 ? (
            <Pressable onPress={onClear} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear conversation">
              <Ionicons name="create-outline" size={24} color={colors.sub} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.list}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={s.starters}>
              <Sub>Try one of these:</Sub>
              {starters.map((q) => (
                <Chip key={q} label={q} onPress={() => send(q)} />
              ))}
            </View>
          }
          ListFooterComponent={busy ? <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', margin: 12 }} /> : undefined}
          renderItem={({ item }) => (
            <View style={[s.bubble, item.role === 'user' ? s.mine : s.theirs]}>
              <Text style={[s.text, item.role === 'user' && { color: '#fff' }]}>{item.text}</Text>
            </View>
          )}
        />

        <View style={s.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask the coach"
            placeholderTextColor={colors.faint}
            style={s.input}
            multiline
            maxLength={600}
            accessibilityLabel="Message"
            onSubmitEditing={() => send(draft)}
            submitBehavior="submit"
          />
          <Pressable
            onPress={() => send(draft)}
            disabled={!draft.trim() || busy}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={[s.send, (!draft.trim() || busy) && { opacity: 0.4 }]}>
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Pressable>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 20 },
  list: { padding: 20, gap: 10, flexGrow: 1 },
  starters: { gap: 10, alignItems: 'flex-start' },
  bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  text: { fontSize: 16, lineHeight: 22, color: colors.ink },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  input: { flex: 1, minHeight: 46, maxHeight: 120, borderRadius: 23, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 16, color: colors.ink },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
