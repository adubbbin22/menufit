import { useState } from 'react';

import { Chat } from '@/components/chat';
import { ApiError, aiEnabled, chatAi } from '@/lib/api';
import { localCoachReply } from '@/lib/coach';
import { useStore } from '@/lib/store';
import { useDay } from '@/lib/use-day';

const STARTERS = ['What do I have left today?', 'What should I order at a Mexican place?', 'Best sushi order for protein?', 'How do I handle drinks?'];

export default function Coach() {
  const chat = useStore((s) => s.chat);
  const addChat = useStore((s) => s.addChat);
  const clearChat = useStore((s) => s.clearChat);
  const { profile, targets, left, user } = useDay();
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    addChat({ role: 'user', text });
    if (!aiEnabled) {
      addChat({ role: 'assistant', text: localCoachReply(text, profile, targets, left) });
      return;
    }
    setBusy(true);
    try {
      const history = useStore.getState().chat.slice(-20).map(({ role, text: t }) => ({ role, text: t }));
      const { reply } = await chatAi(history, user);
      addChat({ role: 'assistant', text: reply });
    } catch (e) {
      addChat({ role: 'assistant', text: e instanceof ApiError ? e.message : 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Chat
      title="Coach"
      subtitle={aiEnabled ? 'Ask anything about eating out.' : 'Offline mode: built-in guidance only.'}
      messages={chat}
      starters={STARTERS}
      busy={busy}
      onSend={send}
      onClear={clearChat}
    />
  );
}
