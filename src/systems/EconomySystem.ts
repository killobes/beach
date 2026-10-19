// OCEAN GAIA V3.2 — Economy System
// 세션 B 소유 — Three.js import 금지

import type { Specimen } from '../core/GameEngine';
import { SPECIES_BY_ID } from '../data/species';

export interface EconomyConfig {
  basePriceMultiplier: number;
  sizePriceExponent: number;
  rarityPriceMultiplier: number;
  sellCooldown: number; // seconds between sells
  bulkDiscount: number; // discount when selling many
  companionSellBonus: number;
  observationBaseReward: number;
  observationRarityMultiplier: number;
}

export const DEFAULT_ECONOMY_CONFIG: EconomyConfig = {
  basePriceMultiplier: 1.0,
  sizePriceExponent: 1.5,
  rarityPriceMultiplier: 1.3,
  sellCooldown: 0,
  bulkDiscount: 0,
  companionSellBonus: 0.2,
  observationBaseReward: 5,
  observationRarityMultiplier: 2.0,
};

export interface SaleResult {
  totalEarned: number;
  itemsSold: number;
  breakdown: Array<{
    specimenUid: string;
    speciesName: string;
    lengthCm: number;
    weightKg: number;
    price: number;
  }>;
}

export interface PriceEstimate {
  specimenUid: string;
  speciesName: string;
  estimatedPrice: number;
}

export class EconomySystem {
  private config: EconomyConfig;
  private lastSellTime: number = 0;

  constructor(config: EconomyConfig = DEFAULT_ECONOMY_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate price for a single specimen
   */
  calculatePrice(specimen: Specimen, sellBonus: number = 0): number {
    const species = SPECIES_BY_ID.get(specimen.speciesId);
    if (!species) return 0;
    if (species.protected) return 0; // Protected species cannot be sold

    // Base price from species data
    const basePrice = species.sellBasePrice;

    // Size bonus: bigger = more valuable (exponential)
    const sizeRatio = specimen.lengthCm / species.gameBaseLengthCm;
    const sizeBonus = Math.pow(sizeRatio, this.config.sizePriceExponent);

    // Rarity bonus
    const rarityBonus = Math.pow(this.config.rarityPriceMultiplier, species.rarity - 1);

    // Companion bonus
    const companionMod = 1 + sellBonus;

    const price = basePrice * sizeBonus * rarityBonus * companionMod * this.config.basePriceMultiplier;
    return Math.max(1, Math.round(price));
  }

  /**
   * Sell all cargo
   */
  sellAll(cargo: Specimen[], sellBonus: number = 0): SaleResult {
    const breakdown: SaleResult['breakdown'] = [];
    let totalEarned = 0;

    for (const specimen of cargo) {
      const species = SPECIES_BY_ID.get(specimen.speciesId);
      if (!species || species.protected) continue;

      const price = this.calculatePrice(specimen, sellBonus);
      totalEarned += price;

      breakdown.push({
        specimenUid: specimen.uid,
        speciesName: species.name,
        lengthCm: specimen.lengthCm,
        weightKg: specimen.weightKg,
        price,
      });
    }

    // Apply bulk discount if configured
    if (this.config.bulkDiscount > 0 && breakdown.length > 10) {
      const discount = 1 - (this.config.bulkDiscount * Math.min(1, (breakdown.length - 10) / 50));
      totalEarned = Math.round(totalEarned * discount);
    }

    return {
      totalEarned,
      itemsSold: breakdown.length,
      breakdown,
    };
  }

  /**
   * Calculate observation reward
   */
  calculateObservationReward(speciesId: number, companionBonus: number = 0): number {
    const species = SPECIES_BY_ID.get(speciesId);
    if (!species) return 0;

    const base = this.config.observationBaseReward;
    const rarityBonus = Math.pow(this.config.observationRarityMultiplier, species.rarity - 1);
    const companionMod = 1 + companionBonus;

    return Math.round(base * rarityBonus * companionMod);
  }

  /**
   * Estimate total cargo value
   */
  estimateCargoValue(cargo: Specimen[], sellBonus: number = 0): PriceEstimate[] {
    return cargo.map(specimen => {
      const species = SPECIES_BY_ID.get(specimen.speciesId);
      return {
        specimenUid: specimen.uid,
        speciesName: species?.name || 'Unknown',
        estimatedPrice: this.calculatePrice(specimen, sellBonus),
      };
    });
  }

  /**
   * Check if player can afford a purchase
   */
  canAfford(currentShells: number, price: number): boolean {
    return currentShells >= price;
  }

  /**
   * Get price for shop item
   */
  getShopPrice(basePrice: number): number {
    return basePrice;
  }

  getConfig(): EconomyConfig {
    return this.config;
  }
}
