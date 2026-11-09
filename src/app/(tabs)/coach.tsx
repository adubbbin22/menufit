import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip, H1, Screen, Sub } from '@/components/ui';
import { ApiError, aiEnabled, chatAi } from '@/lib/api';
import { localCoachReply } from '@/lib/coach';
import { useStore } from '@/lib/store';
import { colors, radius } from '@/lib/theme';
import type { ChatMessage } from '@/lib/types';
import { useDay } from '@/lib/use-day';

const STARTERS = ['What do I have left today?', 'What should I order at a Mexican place?', 'Best sushi order for protein?', 'How do I handle drinks?'];

export default function Coach() {
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);
  const clearChat = useStore((s) => s.clearChat);
  const { profile, targets, left, user } = useDay();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList<ChatMessage>>(null);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setDraft('');
    addChat({ role: 'user', text });
    if (!aiEnabled) {
      addChat({ role: 'assistant', text: localCoachReply(text, profile, targets, left) });
      return;
    }
    setBusy(true);
    try {
      const history = [...useStore.getState().chat].slice(-20).map(({ role, text: t }) => ({ role, text: t }));
      const { reply } = await chatAi(history, user);
      addChat({ role: 'assistant', text: reply });
    } catch (e) {
      addChat({ role: 'assistant', text: e instanceof ApiError ? e.message : 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <H1>Coach</H1>
            <Sub>{aiEnabled ? 'Ask anything about eating out.' : 'Offline mode: built-in guidance only.'}</Sub>
          </View>
          {chat.length > 0 ? (
            <Pressable onPress={clearChat} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear conversation">
              <Ionicons name="create-outline" size={24} color={colors.sub} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          ref={list}
          data={chat}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.list}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={s.starters}>
              <Sub>Try one of these:</Sub>
              {STARTERS.map((q) => (
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
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
