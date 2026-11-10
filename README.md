# Tablewise

A React Native (Expo) app for iOS and Android that tells you what to order when you eat out. Tell it your goal, open a restaurant, and every dish on the menu is ranked against what is left in your day.

Tablewise is an original app. Its name, design, copy, sample restaurants and scoring are its own.

## What it does

- **Onboarding** – goal, body stats, activity, diet and allergens produce daily calorie and macro targets (Mifflin-St Jeor).
- **Restaurants** – browse eight built-in sample menus, search by restaurant, cuisine or dish, favorite places.
- **Dish ranking** – each dish gets a 0-100 fit score, a verdict (Great pick / Solid choice / Go easy / Skip it), the reasons, and an ordering tip. Dishes that break your diet or contain something you avoid are flagged and never recommended.
- **Log** – log a dish, or add any meal by name, and the day's remaining calories and macros update; rankings tighten as the day fills up. A seven-day chart shows how each day went.
- **Scan** – paste or type any menu and its dishes are estimated and ranked on-device. With the AI server, photograph a menu instead.
- **Healthify my order** – enter what you were going to order and get the smallest swaps that make it fit, with calories saved.
- **Coach** – ask what is left in your day or what to order at a type of restaurant. With the AI server, ask anything.
- **Profile** – edit everything, set a custom calorie target, erase all data.

All user data stays on the device (AsyncStorage). There are no accounts and no subscription/paywall.

## Run it

```bash
npm install
```

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for a simulator. For store builds use [EAS Build](https://docs.expo.dev/build/introduction/); set your own `bundleIdentifier` / `package` in `app.json` first (they are placeholders).

## Optional AI server

Without a server the app runs entirely on its built-in engine. The server in `server/` adds restaurant lookup by name, menu photo scanning, AI swaps and the open-ended coach. It keeps the API key off the device.

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

Sample-menu figures are typical values for each kind of dish. Pasted menus are estimated from dish names by keyword, and AI results are model estimates; both are labelled as estimates in the app. Allergen flags are best-effort. This is general guidance, not medical advice.
