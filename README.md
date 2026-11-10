# Tablewise

A React Native (Expo) app for iOS and Android that tells you what to order when you eat out. Tell it your goal, open a restaurant, and every dish on the menu is ranked against what is left in your day.

Tablewise is an original app. Its name, design, copy, sample restaurants and scoring are its own.

## What it does

- **Onboarding** – goal, body stats, activity, diet, allergens and disliked foods produce daily calorie and macro targets (Mifflin-St Jeor).
- **Restaurants near you** – uses your location (or a city you type) to list real nearby restaurants from OpenStreetMap, with distance.
- **Real menus** – with the AI server, tapping a restaurant searches the web for its actual menu, uses published nutrition where the restaurant provides it and estimates the rest. Results are cached on the server.
- **Confidence meter** – every menu shows where it came from and how far to trust the numbers.
- **Your best orders** – the top three complete orders at each restaurant (a main, plus a side when it helps), with how to order them.
- **Dish ranking** – every dish gets a 0-100 fit score, a verdict, the reasons and an ordering tip. Dishes that break your diet, contain an allergen you avoid, or include a food you dislike are flagged and never recommended.
- **Build your own order** – tick dishes to see combined calories and macros, then log the lot or send it to Healthify.
- **Healthify** – the smallest swaps that make an order fit, with calories saved.
- **Ask about this menu** – a chat that knows the menu you are looking at; plus a general Coach tab.
- **Scan** – photograph a menu (AI server) or paste/type it (works offline).
- **Log** – log dishes or add any meal by name; a seven-day chart shows how each day went.
- **Profile** – edit everything, set a custom calorie target, erase all data.

All user data stays on the device (AsyncStorage). There are no accounts and no subscription/paywall.

### What needs the AI server

Nearby restaurants, demo menus, pasted menus, ranking, best orders, the order builder, rule-based swaps and built-in coaching all work without it. Fetching a real restaurant's menu, reading a menu photo, AI swaps and open-ended chat need the server and an Anthropic API key.

## Run it

```bash
npm install
```

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. For store builds use [EAS Build](https://docs.expo.dev/build/introduction/); set your own `bundleIdentifier` / `package` in `app.json` first (they are placeholders).

## Optional AI server

The server in `server/` finds real menus with web search, reads menu photos, and powers AI swaps and chat. It keeps the API key off the device and caches menus in `server/.cache/`.

```bash
cd server && npm install
```

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Then point the app at it and restart Expo (use your computer's LAN address when testing on a phone):

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:8787 npx expo start
```

The server has no authentication or rate limiting. Add both before exposing it to the internet.

## Checks

```bash
npm test
```

```bash
npm run typecheck
```

## Layout

```
src/app/          screens (expo-router): onboarding, tabs, restaurant/[id], healthify
src/components/   shared UI, profile form fields, dish sheet
src/lib/          targets, scoring, offline estimator, swaps, sample catalog, store, API client
server/           optional AI endpoints
tests/            unit tests for the engine
```

## Accuracy

The demo restaurants are invented, with typical values for each kind of dish. Pasted menus are estimated from dish names by keyword. AI-fetched menus use the restaurant's published nutrition when it exists and model estimates otherwise, and can be out of date or wrong; the confidence meter says which.

Nearby places come from the public OpenStreetMap services (Overpass, with Nominatim as fallback), which are rate-limited and meant for light use. For a real launch, set `EXPO_PUBLIC_OVERPASS_URLS` / `EXPO_PUBLIC_NOMINATIM_URL` to your own instances or swap in a commercial places API. Allergen flags are best-effort. This is general guidance, not medical advice.
