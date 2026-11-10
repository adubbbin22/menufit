import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button, Card, Field, H1, H2, Notice, Screen, Sub } from '@/components/ui';
import { ApiError, aiEnabled, scanMenu } from '@/lib/api';
import { rateAiMenu } from '@/lib/confidence';
import { parseMenuText } from '@/lib/estimate';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function Scan() {
  const router = useRouter();
  const saveRestaurant = useStore((s) => s.saveRestaurant);
  const params = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(params.name ?? '');
  // Arriving from a nearby place fills in its name, even if this tab was already open.
  useEffect(() => {
    if (params.name) setName(params.name);
  }, [params.name]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = (id: string) => {
    setName('');
    setText('');
    router.push(`/restaurant/${id}`);
  };

  const fromPhoto = async (source: 'camera' | 'library') => {
    setError(null);
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Camera access is off. Allow it in Settings, or choose a photo from your library.');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.6 };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;

    setBusy(true);
    try {
      const menu = await scanMenu(asset.base64, asset.mimeType ?? 'image/jpeg');
      if (menu.items.length === 0) {
        setError('No dishes could be read from that photo. Try a sharper, straight-on shot of the menu.');
        return;
      }
      finish(saveRestaurant({ name: name.trim() || menu.name || 'Scanned menu', cuisine: menu.cuisine || 'Scanned menu', emoji: '📷', source: 'scan', ...rateAiMenu({ ...menu, menuSource: 'photo' }), items: menu.items }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong reading that photo.');
    } finally {
      setBusy(false);
    }
  };

  const fromText = () => {
    setError(null);
    const items = parseMenuText(text);
    if (items.length === 0) {
      setError('No dishes found. Put one dish per line.');
      return;
    }
    finish(saveRestaurant({ name: name.trim() || 'Pasted menu', cuisine: 'Pasted menu', emoji: '📋', source: 'text', confidence: 'low', sourceNote: 'Dishes you typed; nutrition estimated from dish names.', items }));
  };

  return (
    <Screen>
      <H1>Scan a menu</H1>
      <Sub>Get every dish on any menu ranked for your goals, even when the menu lists no calories.</Sub>
      <Field label="Restaurant name (optional)" value={name} onChangeText={setName} placeholder="e.g. Corner Bistro" maxLength={60} />

      <Card>
        <H2>From a photo</H2>
        {aiEnabled ? (
          <>
            <Sub>Take a clear, straight-on picture of the menu. The AI reads the dishes and estimates their nutrition.</Sub>
            <View style={s.row}>
              {Platform.OS !== 'web' ? <Button label="Take photo" icon="camera" onPress={() => fromPhoto('camera')} loading={busy} style={{ flex: 1 }} /> : null}
              <Button label="Choose photo" icon="image" variant="secondary" onPress={() => fromPhoto('library')} loading={busy} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <Notice>Photo scanning needs the AI server. Until it is connected, paste or type the menu below.</Notice>
        )}
      </Card>

      <Card>
        <H2>Paste or type the menu</H2>
        <Sub>One dish per line. Add a description after a dash for a better estimate.</Sub>
        <Field
          value={text}
          onChangeText={setText}
          multiline
          placeholder={'Grilled salmon - lemon butter, asparagus\nBacon cheeseburger with fries\nCaesar salad'}
          style={s.area}
          accessibilityLabel="Menu text"
        />
        <Button label="Rank these dishes" icon="list" onPress={fromText} disabled={text.trim().length < 3} />
      </Card>
      {error ? <Sub style={{ color: colors.danger }}>{error}</Sub> : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  area: { minHeight: 140, textAlignVertical: 'top' },
});
