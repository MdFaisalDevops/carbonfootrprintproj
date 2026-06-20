/**
 * CarbonMind AI — Shared Constants
 * Single source of truth for emission factors, score thresholds, and level definitions.
 * Import from this file instead of re-declaring locally in each component.
 */

/** Maximum possible carbon impact score */
export const MAX_SCORE = 1000;

/** Circumference of the score gauge arc (r=70, arc ≈ 5/6 of circle) */
export const GAUGE_CIRCUMFERENCE = 439.8;

/** Daily CO₂ baseline for an average Indian urban resident (kg CO₂/day) */
export const BASELINE_DAILY_KG = 32.0;

/**
 * Emission factors (kg CO₂ per day) for each lifestyle category and option.
 * Values are calibrated for Indian urban context.
 */
export const EMISSION_FACTORS = {
  transport: {
    car_single: 12.0,
    car_pool:   6.0,
    metro:      1.5,
    ev:         0.8,
    cycle:      0.0,
  },
  diet: {
    meat_heavy:    8.0,
    meat_moderate: 4.5,
    vegetarian:    2.0,
    vegan:         0.8,
  },
  energy: {
    high:   9.0,
    medium: 5.0,
    low:    2.0,
    solar:  0.2,
  },
  waste: {
    none:    3.0,
    basic:   1.0,
    compost: 0.2,
  },
  shopping: {
    high:   2.5,
    medium: 1.2,
    low:    0.4,
    minimal: 0.1,
  },
};

/**
 * Score → standing level thresholds (inclusive upper bounds).
 * Used by App.jsx to compute userLevel and by Gamification.jsx for progress bars.
 */
export const LEVEL_THRESHOLDS = [
  { max: 300,  label: 'High Impact User' },
  { max: 600,  label: 'Eco Beginner' },
  { max: 750,  label: 'Conscious User' },
  { max: 900,  label: 'Balanced User' },
  { max: 1000, label: 'Green Optimizer' },
];

/**
 * Derives the user's standing label from a numeric score.
 * @param {number} score - Carbon score 0–1000
 * @returns {string} Standing level label
 */
export function getLevelFromScore(score) {
  const found = LEVEL_THRESHOLDS.find(t => score <= t.max);
  return found ? found.label : 'Green Optimizer';
}

/**
 * Computes the daily carbon footprint from a habits object.
 * @param {{ transport: string, diet: string, energy: string, waste: string, shopping: string }} habits
 * @returns {number} Total kg CO₂ per day
 */
export function computeDailyFootprint(habits) {
  return (
    (EMISSION_FACTORS.transport[habits.transport] ?? 0) +
    (EMISSION_FACTORS.diet[habits.diet]           ?? 0) +
    (EMISSION_FACTORS.energy[habits.energy]       ?? 0) +
    (EMISSION_FACTORS.waste[habits.waste]         ?? 0) +
    (EMISSION_FACTORS.shopping[habits.shopping]   ?? 0)
  );
}

/**
 * Converts a daily footprint into a 0–1000 score.
 * @param {number} footprint - kg CO₂/day
 * @returns {number} Clamped integer score
 */
export function computeScore(footprint) {
  return Math.max(0, Math.min(MAX_SCORE, Math.round(MAX_SCORE - footprint * 20)));
}
