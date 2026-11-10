import type { AiMenu } from './api';
import type { Confidence, Restaurant } from './types';

/** Rates an AI-returned menu by where it came from and how many numbers are the restaurant's own. */
export function rateAiMenu(menu: AiMenu): { confidence: Confidence; sourceNote: string } {
  const published = menu.items.filter((i) => i.published).length / Math.max(1, menu.items.length);
  const found = menu.menuSource === 'official' || menu.menuSource === 'third_party' || menu.menuSource === 'photo';
  const where =
    menu.menuSource === 'official'
      ? "Menu from the restaurant's own site"
      : menu.menuSource === 'third_party'
        ? 'Menu from a listing or delivery site'
        : menu.menuSource === 'photo'
          ? 'Menu read from your photo'
          : 'Menu recalled by AI without a live source';
  const numbers = published >= 0.5 ? 'published nutrition' : published > 0 ? 'some published nutrition, the rest estimated' : 'nutrition estimated by AI';
  const confidence: Confidence = found && published >= 0.5 ? 'high' : found ? 'medium' : 'low';
  return { confidence, sourceNote: `${where}; ${numbers}.` };
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

export function describeConfidence(r: Restaurant): { level: Confidence | null; label: string; note: string } {
  if (r.source === 'sample') return { level: null, label: 'Demo menu', note: 'An invented example restaurant with typical nutrition values.' };
  const level = r.confidence ?? 'low';
  return { level, label: CONFIDENCE_LABEL[level], note: r.sourceNote ?? 'Nutrition estimated from dish names.' };
}
