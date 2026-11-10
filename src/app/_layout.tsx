import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  const hasProfile = useStore((s) => s.profile !== null);

  useEffect(() => {
    const done = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return done;
  }, []);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          {/* Everything except onboarding needs a profile; the guards redirect automatically. */}
          <Stack.Protected guard={hasProfile}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="restaurant/[id]" />
            <Stack.Screen name="ask/[id]" />
            <Stack.Screen name="healthify" options={{ presentation: 'modal' }} />
          </Stack.Protected>
          <Stack.Protected guard={!hasProfile}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
