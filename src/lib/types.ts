export type Goal = 'lose' | 'maintain' | 'gain';
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active';
export type Diet = 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'lowcarb';
export type Allergen = 'gluten' | 'dairy' | 'nuts' | 'shellfish' | 'egg' | 'soy' | 'fish';
export type DishKind = 'meat' | 'fish' | 'vegetarian' | 'vegan';
export type Units = 'imperial' | 'metric';

export interface Profile {
  name: string;
  goal: Goal;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  diet: Diet;
  avoid: Allergen[];
  /** Free-text foods the user does not want, e.g. "mushrooms". */
  dislikes?: string[];
  units: Units;
  /** Manual override of the computed targets, if the user set one. */
  customTargets?: Targets;
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  kind: DishKind;
  contains: Allergen[];
  /** A concrete ordering tweak that makes this dish fit better. */
  tip?: string;
  /** True when the numbers are the restaurant's own published figures. */
  published?: boolean;
}

export type RestaurantSource = 'sample' | 'ai' | 'scan' | 'text';
/** How far the menu and its nutrition numbers can be trusted. */
export type Confidence = 'high' | 'medium' | 'low';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  blurb?: string;
  source: RestaurantSource;
  confidence?: Confidence;
  /** Where the menu came from, shown to the user. */
  sourceNote?: string;
  sourceUrl?: string;
  address?: string;
  items: MenuItem[];
  savedAt?: number;
}

export interface LogEntry {
  id: string;
  date: string; // YYYY-MM-DD, local
  at: number;
  restaurantName: string;
  itemName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type Verdict = 'great' | 'good' | 'careful' | 'skip';

export interface Fit {
  score: number; // 0..100
  verdict: Verdict;
  /** True when the dish breaks a diet rule or contains something the user avoids. */
  conflict: boolean;
  reasons: string[];
}

export interface Swap {
  from: string;
  to: string;
  why: string;
  saves: number; // approx calories saved
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface Place {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  lat: number;
  lon: number;
  distanceM: number;
  address?: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
  label: string;
}

/** A complete order built from one or more menu items. */
export interface Meal {
  id: string;
  items: MenuItem[];
  totals: Targets;
  fit: Fit;
  howToOrder: string[];
}
