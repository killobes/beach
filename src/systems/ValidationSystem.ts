// OCEAN GAIA V3.2 — Edge Case & Validation System
// 세션 B 소유 — Three.js import 금지

import type { GameState, Specimen } from '../core/GameEngine';
import { SPECIES_BY_ID } from '../data/species';
import { WORLD_CONFIG } from '../data/world';
import { SHIP_UPGRADES, HARPOONS, TANKS, SUITS } from '../data/equipment';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates game state integrity
 * Prevents corrupted state from breaking the game
 */
export function validateState(state: GameState): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ─── Numeric Bounds ───
  if (state.shells < 0) {
    errors.push(`Negative shells: ${state.shells}`);
    state.shells = 0;
  }
  if (state.shells > 999999999) {
    warnings.push(`Excessive shells: ${state.shells}`);
  }

  if (state.shipLevel < 1 || state.shipLevel > 5) {
    errors.push(`Invalid ship level: ${state.shipLevel}`);
    state.shipLevel = Math.max(1, Math.min(5, state.shipLevel));
  }

  if (state.airRemaining < 0 || state.airRemaining > 100) {
    errors.push(`Invalid air: ${state.airRemaining}`);
    state.airRemaining = Math.max(0, Math.min(100, state.airRemaining));
  }

  if (state.hour < 0 || state.hour >= 24) {
    errors.push(`Invalid hour: ${state.hour}`);
    state.hour = ((state.hour % 24) + 24) % 24;
  }

  if (state.day < 1) {
    errors.push(`Invalid day: ${state.day}`);
    state.day = 1;
  }

  // ─── World Bounds ───
  if (state.shipX < 0 || state.shipX > WORLD_CONFIG.widthM) {
    errors.push(`Ship X out of bounds: ${state.shipX}`);
    state.shipX = Math.max(0, Math.min(WORLD_CONFIG.widthM, state.shipX));
  }
  if (state.shipZ < 0 || state.shipZ > WORLD_CONFIG.heightM) {
    errors.push(`Ship Z out of bounds: ${state.shipZ}`);
    state.shipZ = Math.max(0, Math.min(WORLD_CONFIG.heightM, state.shipZ));
  }

  if (state.diverX < 0 || state.diverX > WORLD_CONFIG.widthM) {
    state.diverX = Math.max(0, Math.min(WORLD_CONFIG.widthM, state.diverX));
  }
  if (state.diverZ < 0 || state.diverZ > WORLD_CONFIG.heightM) {
    state.diverZ = Math.max(0, Math.min(WORLD_CONFIG.heightM, state.diverZ));
  }
  if (state.diverY > 0 || state.diverY < -5000) {
    state.diverY = Math.max(-5000, Math.min(0, state.diverY));
  }

  // ─── Equipment Validation ───
  if (!HARPOONS.find(h => h.id === state.equippedHarpoon)) {
    errors.push(`Invalid equipped harpoon: ${state.equippedHarpoon}`);
    state.equippedHarpoon = 1;
  }
  if (!TANKS.find(t => t.id === state.equippedTank)) {
    errors.push(`Invalid equipped tank: ${state.equippedTank}`);
    state.equippedTank = 1;
  }
  if (!SUITS.find(s => s.id === state.equippedSuit)) {
    errors.push(`Invalid equipped suit: ${state.equippedSuit}`);
    state.equippedSuit = 1;
  }

  // ─── Cargo Validation ───
  const maxCargo = SHIP_UPGRADES[state.shipLevel - 1]?.cargoCapacity || 10;
  if (state.cargo.length > maxCargo) {
    warnings.push(`Cargo exceeds capacity: ${state.cargo.length} > ${maxCargo}`);
    state.cargo = state.cargo.slice(0, maxCargo);
  }

  // Validate each specimen in cargo
  for (let i = state.cargo.length - 1; i >= 0; i--) {
    const spec = state.cargo[i];
    if (!validateSpecimen(spec)) {
      warnings.push(`Invalid specimen removed from cargo: ${spec.uid}`);
      state.cargo.splice(i, 1);
    }
  }

  // ─── Active Specimens Validation ───
  if (state.activeSpecimens.length > 200) {
    warnings.push(`Too many active specimens: ${state.activeSpecimens.length}`);
    state.activeSpecimens = state.activeSpecimens.slice(0, 200);
  }

  for (let i = state.activeSpecimens.length - 1; i >= 0; i--) {
    const spec = state.activeSpecimens[i];
    if (!validateSpecimen(spec)) {
      state.activeSpecimens.splice(i, 1);
    }
  }

  // ─── Codex Validation ───
  for (const [sid, entry] of Object.entries(state.codex)) {
    const speciesId = Number(sid);
    if (!SPECIES_BY_ID.has(speciesId)) {
      warnings.push(`Unknown species in codex: ${speciesId}`);
      delete state.codex[speciesId];
      continue;
    }
    if (entry.catchCount < 0) entry.catchCount = 0;
    if (entry.observeCount < 0) entry.observeCount = 0;
    if (entry.maxLengthCm < 0) entry.maxLengthCm = 0;
    if (entry.maxWeightKg < 0) entry.maxWeightKg = 0;
  }

  // ─── Companions Validation ───
  const validCompanions = ['mia', 'ari', 'leo'];
  state.companions = state.companions.filter(c => validCompanions.includes(c));
  if (state.companions.length > 3) {
    state.companions = state.companions.slice(0, 3);
  }

  // ─── Fossils Validation ───
  state.fossils = state.fossils.filter(f => f >= 1 && f <= 15);
  state.fossils = [...new Set(state.fossils)]; // Remove duplicates

  // ─── Boss Validation ───
  const validBosses = ['dunkleosteus', 'megalodon', 'mosasaurus'];
  if (state.bossActive && !validBosses.includes(state.bossActive)) {
    warnings.push(`Invalid boss: ${state.bossActive}`);
    state.bossActive = null;
    state.bossHp = 0;
  }
  if (state.bossHp < 0) {
    state.bossHp = 0;
    state.bossActive = null;
  }

  // ─── Stats Validation ───
  if (state.totalDives < 0) state.totalDives = 0;
  if (state.totalCatches < 0) state.totalCatches = 0;
  if (state.uniqueSpeciesCaught < 0) state.uniqueSpeciesCaught = 0;
  if (state.uniqueSpeciesCaught > 200) state.uniqueSpeciesCaught = 200;

  // ─── Tick & Time Validation ───
  if (state.tick < 0) state.tick = 0;
  if (state.gameTimeSec < 0) state.gameTimeSec = 0;
  if (state.tick > 999999999) {
    warnings.push(`Tick overflow: ${state.tick}`);
    state.tick = 0;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a single specimen
 */
function validateSpecimen(spec: Specimen): boolean {
  if (!spec.uid || typeof spec.uid !== 'string') return false;
  if (!spec.speciesId || spec.speciesId < 1 || spec.speciesId > 200) return false;
  if (!SPECIES_BY_ID.has(spec.speciesId)) return false;
  if (spec.lengthCm <= 0 || spec.lengthCm > 10000) return false;
  if (spec.weightKg <= 0 || spec.weightKg > 100000) return false;
  if (spec.depthM < 0 || spec.depthM > 11000) return false;
  if (isNaN(spec.x) || isNaN(spec.z)) return false;
  if (spec.x < 0 || spec.x > WORLD_CONFIG.widthM) return false;
  if (spec.z < 0 || spec.z > WORLD_CONFIG.heightM) return false;
  return true;
}

/**
 * Sanitizes snapshot before saving to prevent data corruption
 */
export function sanitizeSnapshot(state: GameState): GameState {
  const sanitized = JSON.parse(JSON.stringify(state));

  // Ensure all numeric fields are finite
  const numericFields = ['shells', 'shipLevel', 'shipX', 'shipZ', 'shipHeading',
    'diverX', 'diverZ', 'diverY', 'diverHeading', 'airRemaining',
    'equippedHarpoon', 'equippedTank', 'equippedSuit',
    'tick', 'gameTimeSec', 'day', 'hour', 'weatherTimer',
    'totalDives', 'totalCatches', 'uniqueSpeciesCaught', 'bossHp'];

  for (const field of numericFields) {
    if (typeof sanitized[field] === 'number' && !isFinite(sanitized[field])) {
      sanitized[field] = 0;
    }
  }

  // Ensure arrays are arrays
  if (!Array.isArray(sanitized.cargo)) sanitized.cargo = [];
  if (!Array.isArray(sanitized.storage)) sanitized.storage = [];
  if (!Array.isArray(sanitized.ownedHarpoons)) sanitized.ownedHarpoons = [1];
  if (!Array.isArray(sanitized.ownedTanks)) sanitized.ownedTanks = [1];
  if (!Array.isArray(sanitized.ownedSuits)) sanitized.ownedSuits = [1];
  if (!Array.isArray(sanitized.companions)) sanitized.companions = [];
  if (!Array.isArray(sanitized.fossils)) sanitized.fossils = [];
  if (!Array.isArray(sanitized.activeSpecimens)) sanitized.activeSpecimens = [];

  // Ensure codex is an object
  if (typeof sanitized.codex !== 'object' || sanitized.codex === null) {
    sanitized.codex = {};
  }

  return sanitized;
}

/**
 * Anti-cheat: Detects impossible state changes
 */
export function detectImpossibleState(prev: GameState, next: GameState): string[] {
  const violations: string[] = [];

  // Shells can't decrease without a purchase
  if (next.shells > prev.shells + 1000000) {
    violations.push(`Impossible shell gain: ${prev.shells} → ${next.shells}`);
  }

  // Ship level can only increase by 1
  if (next.shipLevel > prev.shipLevel + 1) {
    violations.push(`Impossible ship level jump: ${prev.shipLevel} → ${next.shipLevel}`);
  }

  // Total catches can't decrease
  if (next.totalCatches < prev.totalCatches) {
    violations.push(`Catches decreased: ${prev.totalCatches} → ${next.totalCatches}`);
  }

  // Total dives can't decrease
  if (next.totalDives < prev.totalDives) {
    violations.push(`Dives decreased: ${prev.totalDives} → ${next.totalDives}`);
  }

  // Unique species can't exceed 200
  if (next.uniqueSpeciesCaught > 200) {
    violations.push(`Unique species exceeds 200: ${next.uniqueSpeciesCaught}`);
  }

  return violations;
}

/**
 * Rate limiting for actions
 */
export class ActionRateLimiter {
  private lastActionTime: Map<string, number> = new Map();
  private minInterval: number; // milliseconds

  constructor(minIntervalMs: number = 50) {
    this.minInterval = minIntervalMs;
  }

  canPerform(actionType: string): boolean {
    const now = Date.now();
    const lastTime = this.lastActionTime.get(actionType) || 0;
    if (now - lastTime < this.minInterval) {
      return false;
    }
    this.lastActionTime.set(actionType, now);
    return true;
  }

  reset(): void {
    this.lastActionTime.clear();
  }
}
