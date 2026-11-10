import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Field, H1, H2, Notice, Screen, Sub } from '@/components/ui';
import { ApiError, aiEnabled, lookupRestaurant } from '@/lib/api';
import { CATALOG } from '@/lib/catalog';
import { rateAiMenu } from '@/lib/confidence';
import { PlacesError, fetchNearby, formatDistance, reverseLabel, searchCity, type CityHit } from '@/lib/places';
import { useProfile, useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import type { Place, Restaurant } from '@/lib/types';

const SOURCE_LABEL: Record<Restaurant['source'], string> = {
  sample: 'Demo menu',
  ai: 'Real menu, found by AI',
  scan: 'Scanned menu',
  text: 'Pasted menu',
};

function Row({ emoji, name, line, note, right, onPress, busy }: { emoji: string; name: string; line: string; note?: string; right?: React.ReactNode; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={busy} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card style={s.row}>
        <Text style={s.emoji}>{emoji}</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.name}>{name}</Text>
          <Sub>{line}</Sub>
          {note ? <Sub style={{ color: colors.faint }}>{note}</Sub> : null}
        </View>
        {right}
        {busy ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="chevron-forward" size={20} color={colors.faint} />}
      </Card>
    </Pressable>
  );
}

export default function Explore() {
  const router = useRouter();
  const profile = useProfile();
  const saved = useStore((s) => s.saved);
  const favorites = useStore((s) => s.favorites);
  const location = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const saveRestaurant = useStore((s) => s.saveRestaurant);

  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [changing, setChanging] = useState(false);
  const [city, setCity] = useState('');
  const [cityHits, setCityHits] = useState<CityHit[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lat = location?.lat;
  const lon = location?.lon;
  const loadPlaces = useCallback(async () => {
    if (lat === undefined || lon === undefined) return;
    setLoadingPlaces(true);
    setPlacesError(null);
    try {
      setPlaces(await fetchNearby(lat, lon));
    } catch (e) {
      setPlacesError(e instanceof PlacesError ? e.message : 'Could not load nearby restaurants.');
    } finally {
      setLoadingPlaces(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const useMyLocation = async () => {
    setLocating(true);
    setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        setError('Location access is off. Allow it in Settings, or set a city below.');
        setChanging(true);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setLocation({ lat: latitude, lon: longitude, label: await reverseLabel(latitude, longitude) });
      setChanging(false);
    } catch {
      setError('Could not get your location. Set a city below instead.');
      setChanging(true);
    } finally {
      setLocating(false);
    }
  };

  const findCity = async () => {
    setError(null);
    try {
      const hits = await searchCity(city.trim());
      setCityHits(hits);
      if (hits.length === 0) setError(`No place found for "${city.trim()}".`);
    } catch (e) {
      setError(e instanceof PlacesError ? e.message : 'Could not search for that place.');
    }
  };

  /** Fetches a real restaurant's menu through the AI server, saves it and opens it. */
  const lookup = async (id: string, name: string, emoji: string, address?: string) => {
    setBusyId(id);
    setError(null);
    try {
      const menu = await lookupRestaurant(name, address ?? location?.label ?? '');
      if (menu.items.length === 0) {
        setError(`No menu found online for "${name}". Scan or paste its menu on the Scan tab instead.`);
        return;
      }
      const newId = saveRestaurant({
        name: menu.name || name,
        cuisine: menu.cuisine,
        emoji,
        source: 'ai',
        ...rateAiMenu(menu),
        sourceUrl: menu.sourceUrl || undefined,
        address,
        items: menu.items,
      });
      router.push(`/restaurant/${newId}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const openPlace = (p: Place) => {
    const known = saved.find((r) => r.name.toLowerCase() === p.name.toLowerCase());
    if (known) router.push(`/restaurant/${known.id}`);
    else if (aiEnabled) lookup(p.id, p.name, p.emoji, [p.address, location?.label].filter(Boolean).join(', '));
    else router.push({ pathname: '/scan', params: { name: p.name } });
  };

  const q = query.trim().toLowerCase();
  const match = useCallback((name: string, cuisine: string) => !q || name.toLowerCase().includes(q) || cuisine.toLowerCase().includes(q), [q]);
  const mine = useMemo(
    () =>
      saved
        .filter((r) => match(r.name, r.cuisine) || r.items.some((i) => i.name.toLowerCase().includes(q)))
        .sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))),
    [saved, favorites, match, q],
  );
  const demo = useMemo(
    () =>
      CATALOG.filter((r) => match(r.name, r.cuisine) || r.items.some((i) => i.name.toLowerCase().includes(q))).sort(
        (a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)),
      ),
    [favorites, match, q],
  );
  const nearby = useMemo(() => places.filter((p) => match(p.name, p.cuisine)).slice(0, 40), [places, match]);
  const heart = (id: string) => (favorites.includes(id) ? <Ionicons name="heart" size={18} color={colors.accent} /> : null);

  return (
    <Screen>
      <H1>Restaurants</H1>
      <Field value={query} onChangeText={setQuery} placeholder="Search a restaurant, cuisine or dish" returnKeyType="search" autoCorrect={false} accessibilityLabel="Search restaurants" />
      {error ? <Sub style={{ color: colors.danger }}>{error}</Sub> : null}

      {q.length >= 2 && aiEnabled ? (
        <Button
          label={busyId === 'search' ? 'Finding the menu…' : `Find the menu for "${query.trim()}"`}
          icon="sparkles"
          variant="secondary"
          onPress={() => lookup('search', query.trim(), '🍽️')}
          loading={busyId === 'search'}
        />
      ) : null}

      {mine.length > 0 ? <H2>Your restaurants</H2> : null}
      {mine.map((r) => (
        <Row key={r.id} emoji={r.emoji} name={r.name} line={`${r.cuisine} · ${r.items.length} dishes`} note={SOURCE_LABEL[r.source]} right={heart(r.id)} onPress={() => router.push(`/restaurant/${r.id}`)} />
      ))}

      <View style={s.nearHead}>
        <View style={{ flex: 1 }}>
          <H2>Near you</H2>
          {location ? <Sub>{location.label}</Sub> : null}
        </View>
        {location ? (
          <Pressable onPress={() => setChanging((c) => !c)} accessibilityRole="button" hitSlop={10}>
            <Text style={s.link}>{changing ? 'Done' : 'Change'}</Text>
          </Pressable>
        ) : null}
      </View>

      {!location || changing ? (
        <Card>
          {!location ? <Sub>See the restaurants around you and get the best order at each one.</Sub> : null}
          <Button label="Use my location" icon="navigate" onPress={useMyLocation} loading={locating} />
          <View style={s.cityRow}>
            <Field value={city} onChangeText={setCity} placeholder="Or enter a city or address" accessibilityLabel="City or address" returnKeyType="search" onSubmitEditing={findCity} />
            <Button label="Search" variant="secondary" onPress={findCity} disabled={city.trim().length < 2} />
          </View>
          {cityHits?.map((h) => (
            <Pressable
              key={`${h.lat},${h.lon}`}
              accessibilityRole="button"
              onPress={() => {
                setLocation({ lat: h.lat, lon: h.lon, label: h.label });
                setCityHits(null);
                setCity('');
                setChanging(false);
              }}
              style={s.hit}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={s.hitText}>{h.label}</Text>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {loadingPlaces ? <ActivityIndicator color={colors.primary} style={{ margin: 12 }} /> : null}
      {placesError ? (
        <Card>
          <Sub>{placesError}</Sub>
          <Button label="Try again" variant="secondary" icon="refresh" onPress={loadPlaces} />
        </Card>
      ) : null}
      {location && !loadingPlaces && !placesError && nearby.length === 0 ? <Sub>{q ? 'No nearby restaurant matches your search.' : 'No restaurants found within a mile of this spot.'}</Sub> : null}
      {nearby.length > 0 && !aiEnabled ? (
        <Notice>Fetching a restaurant's menu automatically needs the AI server. Until it is connected, tapping a place takes you to Scan to photograph or paste its menu.</Notice>
      ) : null}
      {nearby.map((p) => (
        <Row
          key={p.id}
          emoji={p.emoji}
          name={p.name}
          line={`${p.cuisine} · ${formatDistance(p.distanceM, profile.units === 'imperial')}`}
          note={p.address}
          busy={busyId === p.id}
          onPress={() => openPlace(p)}
        />
      ))}
      {nearby.length > 0 ? <Sub style={{ color: colors.faint }}>Places © OpenStreetMap contributors</Sub> : null}

      {demo.length > 0 ? <H2>Demo menus</H2> : null}
      {demo.map((r) => (
        <Row key={r.id} emoji={r.emoji} name={r.name} line={`${r.cuisine} · ${r.items.length} dishes`} note={SOURCE_LABEL[r.source]} right={heart(r.id)} onPress={() => router.push(`/restaurant/${r.id}`)} />
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 30 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  nearHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  link: { fontSize: 15, fontWeight: '700', color: colors.primary },
  cityRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  hit: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10 },
  hitText: { flex: 1, fontSize: 15, color: colors.ink },
});
