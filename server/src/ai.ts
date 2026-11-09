import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

// Reads ANTHROPIC_API_KEY (or another configured credential) from the environment.
const client = new Anthropic();

const MODEL = 'claude-opus-5-5';
// If the model declines a request, the API retries it on a fallback model in the same call.
const BETAS = ['server-side-fallback-2026-07-01'];

const Item = z.object({
  name: z.string(),
  description: z.string().describe('Short description of the dish, or an empty string'),
  category: z.string().describe('Menu section, e.g. Starters, Mains, Sides, Desserts, Drinks'),
  calories: z.number(),
  protein: z.number().describe('grams'),
  carbs: z.number().describe('grams'),
  fat: z.number().describe('grams'),
  fiber: z.number().describe('grams'),
  sugar: z.number().describe('grams'),
  sodium: z.number().describe('milligrams'),
  kind: z.enum(['meat', 'fish', 'vegetarian', 'vegan']).describe('fish covers all seafood'),
  contains: z.array(z.enum(['gluten', 'dairy', 'nuts', 'shellfish', 'egg', 'soy', 'fish'])),
  tip: z.string().describe('One concrete ordering tweak that makes the dish lighter, or an empty string'),
});

const Menu = z.object({
  name: z.string().describe('Restaurant name, or an empty string if unknown'),
  cuisine: z.string(),
  items: z.array(Item),
});
export type Menu = z.infer<typeof Menu>;

const Swaps = z.object({
  swaps: z.array(
    z.object({
      from: z.string().describe('The item as the user wrote it'),
      to: z.string().describe('What to order instead'),
      why: z.string().describe('One sentence'),
      saves: z.number().describe('Approximate calories saved'),
    }),
  ),
  tip: z.string().describe('One sentence of overall advice for this order'),
});
export type Swaps = z.infer<typeof Swaps>;

export interface UserContext {
  goal: string;
  diet: string;
  avoid: string[];
  targets: { calories: number; protein: number; carbs: number; fat: number };
  remaining: { calories: number; protein: number; carbs: number; fat: number };
}

export class Declined extends Error {}

type Content = Anthropic.Beta.BetaContentBlockParam[];

function textOf(message: Anthropic.Beta.BetaMessage): string {
  if (message.stop_reason === 'refusal') throw new Declined('The assistant declined this request.');
  if (message.stop_reason === 'max_tokens') throw new Error('Response was cut off before it finished.');
  return message.content
    .flatMap((b) => (b.type === 'text' ? [b.text] : []))
    .join('')
    .trim();
}

async function structured<T extends z.ZodType>(schema: T, system: string, content: Content, maxTokens: number): Promise<z.infer<T>> {
  // Streamed so long menus do not hit HTTP timeouts.
  const message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: maxTokens,
      betas: BETAS,
      fallbacks: 'default',
      system,
      output_config: { effort: 'low', format: zodOutputFormat(schema) },
      messages: [{ role: 'user', content }],
    })
    .finalMessage();
  return schema.parse(JSON.parse(textOf(message)));
}

const NUTRITION_RULES = `Nutrition rules:
- Give your best realistic estimate for a standard restaurant serving of each dish. Restaurant portions are large; do not underestimate.
- calories must be consistent with the macros (4 kcal/g protein and carbs, 9 kcal/g fat).
- "contains" lists allergens the dish normally includes. When unsure, include the allergen rather than leave it out.
- Never invent dishes. Include only dishes that are on the menu.`;

export function menuFromKnowledge(name: string, location: string): Promise<Menu> {
  return structured(
    Menu,
    `You help diners choose what to order. Given a restaurant, return its menu with estimated nutrition per dish.
If it is a chain or a place whose menu you know, list up to 30 of its real, current core menu items across sections, using published nutrition figures where you know them.
If you do not recognise the restaurant or cannot recall its actual menu, return an empty items array. Do not guess at a menu.
${NUTRITION_RULES}`,
    [{ type: 'text', text: `Restaurant: ${name}${location ? `\nLocation: ${location}` : ''}` }],
    32000,
  );
}

export function menuFromImage(imageBase64: string, mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'): Promise<Menu> {
  return structured(
    Menu,
    `You read photos of restaurant menus. Extract every dish you can read from the photo and estimate its nutrition.
If the photo is not a menu or is unreadable, return an empty items array.
${NUTRITION_RULES}`,
    [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
      { type: 'text', text: 'Extract the dishes from this menu.' },
    ],
    32000,
  );
}

function describeUser(u: UserContext): string {
  return `About the diner: goal is to ${u.goal === 'lose' ? 'lose fat' : u.goal === 'gain' ? 'build muscle' : 'maintain weight'}; diet: ${u.diet}; avoids: ${u.avoid.join(', ') || 'nothing'}.
Daily targets: ${u.targets.calories} kcal, ${u.targets.protein} g protein, ${u.targets.carbs} g carbs, ${u.targets.fat} g fat.
Left today: ${Math.round(u.remaining.calories)} kcal, ${Math.round(u.remaining.protein)} g protein.`;
}

export function healthify(order: string, user: UserContext): Promise<Swaps> {
  return structured(
    Swaps,
    `You help diners make the order they already want fit their goals. Suggest the smallest set of swaps or tweaks (at most five) that meaningfully improve the order while keeping it recognisably the same meal. Respect the diner's diet and the foods they avoid. If the order is already sensible, return no swaps.`,
    [{ type: 'text', text: `${describeUser(user)}\n\nPlanned order:\n${order}` }],
    4000,
  );
}

export async function chat(messages: { role: 'user' | 'assistant'; text: string }[], user: UserContext): Promise<string> {
  const message = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    betas: BETAS,
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: `You are the coach inside a mobile app that helps people order well at restaurants. Answer questions about what to order, how dishes compare, and how to fit eating out into their day.
Replies are read on a phone: keep them to a few short sentences or a short list, plain text with no markdown. Be specific and practical, name actual dishes, and give rough calorie figures when useful.
You give general nutrition guidance, not medical advice. For medical conditions, pregnancy, or signs of disordered eating, be supportive and point the person to a doctor or dietitian rather than giving targets. Never encourage eating below the targets shown.
${describeUser(user)}`,
    messages: messages.map((m) => ({ role: m.role, content: m.text })),
  });
  return textOf(message);
}
