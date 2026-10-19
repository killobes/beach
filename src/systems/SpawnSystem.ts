// OCEAN GAIA V3.2 — Spawn System
// 세션 B 소유 — Three.js import 금지

import { SPECIES_DATA, type SpeciesData, type Region } from '../data/species';
import { WORLD_CONFIG, WEATHER_EFFECTS, type WeatherType, type Season } from '../data/world';

export interface SpawnConfig {
  maxActive: number;
  spawnBatchSize: number;
  spawnIntervalTicks: number;
  despawnAgeSec: number;
  playerInfluenceRadius: number;
}

export const DEFAULT_SPAWN_CONFIG: SpawnConfig = {
  maxActive: 80,
  spawnBatchSize: 5,
  spawnIntervalTicks: 60, // every 2 seconds at 30fps
  despawnAgeSec: 600, // 10 minutes
  playerInfluenceRadius: 500,
};

// Season spawn modifiers
const SEASON_SPAWN_MOD: Record<Season, Record<Region, number>> = {
  spring: { tropical: 1.2, glacier: 0.8, volcanic: 1.0, mangrove: 1.3, ocean: 1.1, deepsea: 0.9 },
  summer: { tropical: 1.3, glacier: 0.6, volcanic: 1.1, mangrove: 1.2, ocean: 1.2, deepsea: 0.8 },
  autumn: { tropical: 1.0, glacier: 0.9, volcanic: 1.0, mangrove: 1.1, ocean: 1.0, deepsea: 1.0 },
  winter: { tropical: 0.7, glacier: 1.3, volcanic: 0.9, mangrove: 0.8, ocean: 0.9, deepsea: 1.2 },
};

// Time-of-day spawn modifiers
function getTimeMod(hour: number, region: Region): number {
  const isNight = hour < 6 || hour > 18;
  if (region === 'deepsea') return 1.0; // deep sea always active
  if (isNight) {
    if (region === 'volcanic') return 1.3; // nocturnal volcanic creatures
    return 0.7;
  }
  return 1.0;
}

export class SpawnSystem {
  private config: SpawnConfig;

  constructor(config: SpawnConfig = DEFAULT_SPAWN_CONFIG) {
    this.config = config;
  }

  /**
   * Determines which region should spawn more creatures based on player position
   */
  getRegionSpawnWeights(playerX: number, playerZ: number, weather: WeatherType, season: Season, hour: number): Map<Region, number> {
    const weights = new Map<Region, number>();
    const weatherMod = WEATHER_EFFECTS[weather];
    const seasonMod = SEASON_SPAWN_MOD[season];

    for (const [region, bounds] of Object.entries(WORLD_CONFIG.regions)) {
      const r = region as Region;

      // Base weight
      let weight = 1.0;

      // Player proximity bonus
      const regionCenterX = (bounds.xMin + bounds.xMax) / 2;
      const regionCenterZ = (bounds.zMin + bounds.zMax) / 2;
      const distToPlayer = Math.sqrt(
        (playerX - regionCenterX) ** 2 + (playerZ - regionCenterZ) ** 2
      );

      if (distToPlayer < this.config.playerInfluenceRadius) {
        weight *= 2.0; // More spawns near player
      } else if (distToPlayer < this.config.playerInfluenceRadius * 2) {
        weight *= 1.5;
      }

      // Weather modifier
      weight *= weatherMod.spawnMod[r];

      // Season modifier
      weight *= seasonMod[r];

      // Time modifier
      weight *= getTimeMod(hour, r);

      weights.set(r, weight);
    }

    return weights;
  }

  /**
   * Selects a species to spawn based on weights
   */
  selectSpecies(region: Region, rng: () => number): SpeciesData {
    const regionSpecies = SPECIES_DATA.filter(s => s.region === region);
    if (regionSpecies.length === 0) {
      // Fallback to any species
      return SPECIES_DATA[Math.floor(rng() * SPECIES_DATA.length)];
    }

    // Weighted by inverse rarity (common species spawn more)
    const totalWeight = regionSpecies.reduce((sum, s) => sum + (6 - s.rarity), 0);
    let roll = rng() * totalWeight;

    for (const species of regionSpecies) {
      roll -= (6 - species.rarity);
      if (roll <= 0) return species;
    }

    return regionSpecies[0];
  }

  /**
   * Selects a region to spawn in
   */
  selectRegion(weights: Map<Region, number>, rng: () => number): Region {
    const totalWeight = Array.from(weights.values()).reduce((a, b) => a + b, 0);
    let roll = rng() * totalWeight;

    for (const [region, weight] of weights) {
      roll -= weight;
      if (roll <= 0) return region;
    }

    return 'ocean';
  }

  /**
   * Generates spawn position within a region
   */
  generatePosition(region: Region, rng: () => number): { x: number; z: number } {
    const bounds = WORLD_CONFIG.regions[region];
    const margin = 50;
    return {
      x: bounds.xMin + margin + rng() * (bounds.xMax - bounds.xMin - margin * 2),
      z: bounds.zMin + margin + rng() * (bounds.zMax - bounds.zMin - margin * 2),
    };
  }

  /**
   * Generates spawn depth for a species
   */
  generateDepth(species: SpeciesData, rng: () => number): number {
    const range = species.depthMaxM - species.depthMinM;
    return -(species.depthMinM + rng() * range);
  }

  getConfig(): SpawnConfig {
    return this.config;
  }
}
