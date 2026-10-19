// OCEAN GAIA V3.2 — Traveling Merchant System
// 세션 B 소유 — Three.js import 금지
// 주기적으로 항구를 방문하는 유랑 상인 시스템

import { HARPOONS, TANKS, SUITS, type HarpoonData, type TankData, type SuitData } from '../data/equipment';

export interface MerchantItem {
  type: 'harpoon' | 'tank' | 'suit' | 'material' | 'rare';
  itemId: number;
  name: string;
  price: number;
  stock: number;
  maxStock: number;
  description: string;
}

export interface MerchantState {
  isActive: boolean;
  currentPortId: number | null;
  visitStartTime: number;
  visitDuration: number; // seconds
  nextVisitTime: number;
  visitInterval: number; // seconds between visits
  inventory: MerchantItem[];
  totalVisits: number;
}

export interface MerchantConfig {
  visitDuration: number; // seconds merchant stays at port
  visitInterval: number; // seconds between visits
  inventorySize: number;
  rareItemChance: number; // 0-1
  materialStock: number;
}

export const DEFAULT_MERCHANT_CONFIG: MerchantConfig = {
  visitDuration: 3600, // 1 hour game time
  visitInterval: 7200, // 2 hours game time
  inventorySize: 10,
  rareItemChance: 0.2,
  materialStock: 5,
};

// 유랑 상인 전용 아이템
const MERCHANT_MATERIALS = [
  { id: 1001, name: '산호 조각', price: 50, description: '장비 강화에 사용되는 산호 조각' },
  { id: 1002, name: '진주', price: 200, description: '희귀한 진주. 고급 장비 제작에 사용' },
  { id: 1003, name: '상어 이빨', price: 150, description: '강력한 작살 제작 재료' },
  { id: 1004, name: '심해 수정', price: 500, description: '심해에서만 얻을 수 있는 희귀 자원' },
  { id: 1005, name: '고대 화석', price: 1000, description: '매우 희귀한 고대 생물 화석' },
];

const MERCHANT_RARE_ITEMS = [
  { type: 'harpoon' as const, itemId: 24, name: '전설의 작살', price: 50000, description: '전설적인 성능의 작살' },
  { type: 'tank' as const, itemId: 6, name: '전설의 산소통', price: 30000, description: '전설적인 성능의 산소통' },
  { type: 'suit' as const, itemId: 6, name: '전설의 잠수복', price: 40000, description: '전설적인 성능의 잠수복' },
];

export class TravelingMerchantSystem {
  private config: MerchantConfig;
  private state: MerchantState;
  private ports: number[]; // Available port IDs
  private currentPortIndex: number = 0;

  constructor(config: MerchantConfig = DEFAULT_MERCHANT_CONFIG, portIds: number[] = [1, 4, 7, 9, 12]) {
    this.config = config;
    this.ports = portIds;
    this.state = this.createInitialState();
  }

  private createInitialState(): MerchantState {
    return {
      isActive: false,
      currentPortId: null,
      visitStartTime: 0,
      visitDuration: this.config.visitDuration,
      nextVisitTime: this.config.visitInterval,
      visitInterval: this.config.visitInterval,
      inventory: [],
      totalVisits: 0,
    };
  }

  /**
   * Update merchant state (called every game tick)
   */
  update(gameTimeSec: number, rng: () => number): void {
    // Check if merchant should start visiting
    if (!this.state.isActive && gameTimeSec >= this.state.nextVisitTime) {
      this.startVisit(gameTimeSec, rng);
    }

    // Check if current visit should end
    if (this.state.isActive) {
      const visitEndTime = this.state.visitStartTime + this.state.visitDuration;
      if (gameTimeSec >= visitEndTime) {
        this.endVisit(gameTimeSec);
      }
    }
  }

  /**
   * Start a new visit to a port
   */
  private startVisit(gameTimeSec: number, rng: () => number): void {
    // Select next port (cycle through ports)
    this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length;
    const portId = this.ports[this.currentPortIndex];

    this.state.isActive = true;
    this.state.currentPortId = portId;
    this.state.visitStartTime = gameTimeSec;
    this.state.totalVisits++;

    // Generate inventory
    this.state.inventory = this.generateInventory(rng);
  }

  /**
   * End current visit
   */
  private endVisit(gameTimeSec: number): void {
    this.state.isActive = false;
    this.state.currentPortId = null;
    this.state.nextVisitTime = gameTimeSec + this.state.visitInterval;
    this.state.inventory = [];
  }

  /**
   * Generate merchant inventory
   */
  private generateInventory(rng: () => number): MerchantItem[] {
    const inventory: MerchantItem[] = [];

    // Add random equipment
    const availableHarpoons = HARPOONS.filter(h => h.price > 0 && h.price < 10000);
    const availableTanks = TANKS.filter(t => t.price > 0 && t.price < 5000);
    const availableSuits = SUITS.filter(s => s.price > 0 && s.price < 5000);

    // Add 3-5 harpoons
    const harpoonCount = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < harpoonCount && i < availableHarpoons.length; i++) {
      const harpoon = availableHarpoons[Math.floor(rng() * availableHarpoons.length)];
      inventory.push({
        type: 'harpoon',
        itemId: harpoon.id,
        name: harpoon.name,
        price: Math.round(harpoon.price * (0.8 + rng() * 0.4)), // ±20% price variation
        stock: 1,
        maxStock: 1,
        description: harpoon.specialEffect !== '없음' ? harpoon.specialEffect : '작살',
      });
    }

    // Add 2-3 tanks
    const tankCount = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < tankCount && i < availableTanks.length; i++) {
      const tank = availableTanks[Math.floor(rng() * availableTanks.length)];
      inventory.push({
        type: 'tank',
        itemId: tank.id,
        name: tank.name,
        price: Math.round(tank.price * (0.8 + rng() * 0.4)),
        stock: 1,
        maxStock: 1,
        description: `산소 용량: ${tank.airCapacity}`,
      });
    }

    // Add 2-3 suits
    const suitCount = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < suitCount && i < availableSuits.length; i++) {
      const suit = availableSuits[Math.floor(rng() * availableSuits.length)];
      inventory.push({
        type: 'suit',
        itemId: suit.id,
        name: suit.name,
        price: Math.round(suit.price * (0.8 + rng() * 0.4)),
        stock: 1,
        maxStock: 1,
        description: `방어력: ${(suit.envProtection * 100).toFixed(0)}%`,
      });
    }

    // Add materials
    const materialCount = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < materialCount; i++) {
      const material = MERCHANT_MATERIALS[Math.floor(rng() * MERCHANT_MATERIALS.length)];
      inventory.push({
        type: 'material',
        itemId: material.id,
        name: material.name,
        price: Math.round(material.price * (0.8 + rng() * 0.4)),
        stock: this.config.materialStock,
        maxStock: this.config.materialStock,
        description: material.description,
      });
    }

    // Add rare items (chance-based)
    if (rng() < this.config.rareItemChance) {
      const rareItem = MERCHANT_RARE_ITEMS[Math.floor(rng() * MERCHANT_RARE_ITEMS.length)];
      inventory.push({
        type: rareItem.type,
        itemId: rareItem.itemId,
        name: rareItem.name,
        price: rareItem.price,
        stock: 1,
        maxStock: 1,
        description: rareItem.description,
      });
    }

    return inventory;
  }

  /**
   * Buy item from merchant
   */
  buyItem(itemIndex: number, playerShells: number): {
    success: boolean;
    reason?: string;
    newShells?: number;
    item?: MerchantItem;
  } {
    if (!this.state.isActive) {
      return { success: false, reason: '유랑 상인이 방문 중이 아닙니다' };
    }

    if (itemIndex < 0 || itemIndex >= this.state.inventory.length) {
      return { success: false, reason: '잘못된 아이템 인덱스' };
    }

    const item = this.state.inventory[itemIndex];

    if (item.stock <= 0) {
      return { success: false, reason: '재고가 없습니다' };
    }

    if (playerShells < item.price) {
      return { success: false, reason: '자금이 부족합니다' };
    }

    // Process purchase
    item.stock--;
    const newShells = playerShells - item.price;

    return {
      success: true,
      newShells,
      item: { ...item },
    };
  }

  /**
   * Get current merchant state
   */
  getState(): MerchantState {
    return { ...this.state };
  }

  /**
   * Check if merchant is at a specific port
   */
  isAtPort(portId: number): boolean {
    return this.state.isActive && this.state.currentPortId === portId;
  }

  /**
   * Get time until next visit
   */
  getTimeUntilNextVisit(gameTimeSec: number): number {
    if (this.state.isActive) {
      return 0;
    }
    return Math.max(0, this.state.nextVisitTime - gameTimeSec);
  }

  /**
   * Get visit duration remaining
   */
  getVisitTimeRemaining(gameTimeSec: number): number {
    if (!this.state.isActive) {
      return 0;
    }
    const visitEndTime = this.state.visitStartTime + this.state.visitDuration;
    return Math.max(0, visitEndTime - gameTimeSec);
  }

  /**
   * Format time as human-readable string
   */
  static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  }
}
