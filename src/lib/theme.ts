import type { Verdict } from './types';

export const colors = {
  bg: '#F6F3EC',
  card: '#FFFFFF',
  ink: '#18211D',
  sub: '#5E6A64',
  faint: '#9AA39E',
  line: '#E6E1D6',
  primary: '#0E6B58',
  primarySoft: '#DDEFE9',
  accent: '#E8743B',
  accentSoft: '#FCE9DE',
  danger: '#C2412D',
  protein: '#0E6B58',
  carbs: '#D9A21B',
  fat: '#E8743B',
};

export const verdictColor: Record<Verdict, { fg: string; bg: string }> = {
  great: { fg: '#0E6B58', bg: '#DDEFE9' },
  good: { fg: '#4D7A16', bg: '#E8F1D6' },
  careful: { fg: '#A8650A', bg: '#FBEBCB' },
  skip: { fg: '#B23A26', bg: '#F9DDD6' },
};

export const radius = { sm: 10, md: 16, lg: 22 };
