import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { Chat } from '@/components/chat';
import { ApiError, aiEnabled, chatAi } from '@/lib/api';
import { localMenuReply } from '@/lib/coach';
import { rankItems } from '@/lib/scoring';
import { findRestaurant, uid, useStore } from '@/lib/store';
import type { ChatMessage } from '@/lib/types';
import { useDay } from '@/lib/use-day';

const STARTERS = ['What should I order here?', 'What has the most protein?', 'What is the lightest option?', 'What should I avoid?'];

/** A chat about one restaurant's menu. The thread lives only while the screen is open. */
export default function AskAboutMenu() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const saved = useStore((s) => s.saved);
  const { profile, targets, left, user } = useDay();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const restaurant = findRestaurant(id, saved);
  const ranked = useMemo(() => (restaurant ? rankItems(restaurant.items, profile, targets, left.calories) : []), [restaurant, profile, targets, left.calories]);
  const name = restaurant?.name ?? 'this restaurant';

  const send = async (text: string) => {
    const next: ChatMessage[] = [...messages, { id: uid(), role: 'user', text }];
    setMessages(next);
    const reply = (t: string) => setMessages((m) => [...m, { id: uid(), role: 'assistant', text: t }]);
    if (!restaurant) return reply('That restaurant is no longer in your list.');
    if (!aiEnabled) return reply(localMenuReply(text, name, ranked));
    setBusy(true);
    try {
      const menu = { name, items: restaurant.items.slice(0, 80).map(({ name: n, category, calories, protein, carbs, fat }) => ({ name: n, category, calories, protein, carbs, fat })) };
      const res = await chatAi(next.slice(-20).map(({ role, text: t }) => ({ role, text: t })), user, menu);
      reply(res.reply);
    } catch (e) {
      reply(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Chat
      title={`Ask about ${name}`}
      subtitle={aiEnabled ? 'Answers use this menu and your goals.' : 'Offline mode: answers come from the ranking.'}
      messages={messages}
      starters={STARTERS}
      busy={busy}
      onSend={send}
      onBack={() => router.back()}
      edges={['top', 'bottom']}
    />
  );
}
