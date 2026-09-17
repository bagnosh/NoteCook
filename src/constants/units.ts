// ── Volume base unit: milliliters ──
export const ML_PER_CUP = 236.588;
export const ML_PER_TBSP = 14.7868;
export const ML_PER_TSP = 4.92892;
export const ML_PER_FLOZ = 29.5735;
export const G_PER_LB = 453.592;

export type DryUnit = 'g' | 'lb' | 'cup' | 'tbsp' | 'tsp';
export type LiquidUnit = 'flOz' | 'cc' | 'cup' | 'tbsp' | 'tsp';

export const DRY_UNITS: DryUnit[] = ['g', 'lb', 'cup', 'tbsp', 'tsp'];
export const LIQUID_UNITS: LiquidUnit[] = ['flOz', 'cc', 'cup', 'tbsp', 'tsp'];

export const DRY_UNIT_LABELS: Record<DryUnit, string> = {
  g: 'grams',
  lb: 'pounds',
  cup: 'cups',
  tbsp: 'tbsp',
  tsp: 'tsp',
};

export const LIQUID_UNIT_LABELS: Record<LiquidUnit, string> = {
  flOz: 'fl oz',
  cc: 'mL / cc',
  cup: 'cups',
  tbsp: 'tbsp',
  tsp: 'tsp',
};

export const DENSITY_PRESETS: { label: string; gramsPerCup: number }[] = [
  { label: 'Flour', gramsPerCup: 120 },
  { label: 'Sugar', gramsPerCup: 200 },
  { label: 'Brown Sugar', gramsPerCup: 220 },
  { label: 'Butter', gramsPerCup: 227 },
  { label: 'Rice', gramsPerCup: 185 },
];

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return ((f - 32) * 5) / 9;
}

function dryUnitToGrams(value: number, unit: DryUnit, gramsPerCup: number): number {
  switch (unit) {
    case 'g': return value;
    case 'lb': return value * G_PER_LB;
    case 'cup': return value * gramsPerCup;
    case 'tbsp': return (value * gramsPerCup) / 16;
    case 'tsp': return (value * gramsPerCup) / 48;
  }
}

function gramsToDryUnit(grams: number, unit: DryUnit, gramsPerCup: number): number {
  switch (unit) {
    case 'g': return grams;
    case 'lb': return grams / G_PER_LB;
    case 'cup': return grams / gramsPerCup;
    case 'tbsp': return (grams / gramsPerCup) * 16;
    case 'tsp': return (grams / gramsPerCup) * 48;
  }
}

export function convertDry(value: number, from: DryUnit, to: DryUnit, gramsPerCup: number): number {
  return gramsToDryUnit(dryUnitToGrams(value, from, gramsPerCup), to, gramsPerCup);
}

function liquidUnitToMl(value: number, unit: LiquidUnit): number {
  switch (unit) {
    case 'cc': return value;
    case 'flOz': return value * ML_PER_FLOZ;
    case 'cup': return value * ML_PER_CUP;
    case 'tbsp': return value * ML_PER_TBSP;
    case 'tsp': return value * ML_PER_TSP;
  }
}

function mlToLiquidUnit(ml: number, unit: LiquidUnit): number {
  switch (unit) {
    case 'cc': return ml;
    case 'flOz': return ml / ML_PER_FLOZ;
    case 'cup': return ml / ML_PER_CUP;
    case 'tbsp': return ml / ML_PER_TBSP;
    case 'tsp': return ml / ML_PER_TSP;
  }
}

export function convertLiquid(value: number, from: LiquidUnit, to: LiquidUnit): number {
  return mlToLiquidUnit(liquidUnitToMl(value, from), to);
}

export function roundResult(n: number): number {
  return Math.round(n * 100) / 100;
}
