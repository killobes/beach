// OCEAN GAIA V3.2 — Home Base System
// 세션 B 소유 — 시작 섬 및 집 꾸미기 시스템

export interface FurnitureItem {
  id: number;
  name: string;
  category: 'bed' | 'table' | 'chair' | 'storage' | 'decoration' | 'lighting' | 'aquarium';
  position: { x: number; y: number; z: number };
  rotation: number; // radians
  scale: number;
  price: number;
  unlockCondition: string;
  description: string;
}

export interface HouseState {
  level: number; // 1-5
  unlockedFurniture: number[];
  placedFurniture: FurnitureItem[];
  decorationPoints: number;
}

export const FURNITURE_CATALOG: FurnitureItem[] = [
  // 침대
  { id: 1, name: '간이 침대', category: 'bed', position: { x: 0, y: 0, z: 0 }, rotation: 0, scale: 1, price: 100, unlockCondition: '기본', description: '작은 나무 침대' },
  { id: 2, name: '편안한 침대', category: 'bed', position: { x: 0, y: 0, z: 0 }, rotation: 0, scale: 1.2, price: 500, unlockCondition: '레벨 2', description: '푹신한 침대' },
  { id: 3, name: '고급 침대', category: 'bed', position: { x: 0, y: 0, z: 0 }, rotation: 0, scale: 1.5, price: 2000, unlockCondition: '레벨 3', description: '최고급 침대' },
  
  // 테이블
  { id: 4, name: '나무 책상', category: 'table', position: { x: 2, y: 0, z: 0 }, rotation: 0, scale: 1, price: 150, unlockCondition: '기본', description: '간단한 나무 책상' },
  { id: 5, name: '지도 테이블', category: 'table', position: { x: 2, y: 0, z: 0 }, rotation: 0, scale: 1.2, price: 800, unlockCondition: '레벨 2', description: '지도가 펼쳐진 테이블' },
  { id: 6, name: '연구 테이블', category: 'table', position: { x: 2, y: 0, z: 0 }, rotation: 0, scale: 1.5, price: 3000, unlockCondition: '레벨 4', description: '연구 장비가 있는 테이블' },
  
  // 의자
  { id: 7, name: '나무 의자', category: 'chair', position: { x: 2, y: 0, z: 1 }, rotation: 0, scale: 1, price: 80, unlockCondition: '기본', description: '간단한 나무 의자' },
  { id: 8, name: '안락의자', category: 'chair', position: { x: 2, y: 0, z: 1 }, rotation: 0, scale: 1.2, price: 600, unlockCondition: '레벨 2', description: '편안한 안락의자' },
  { id: 9, name: '선장 의자', category: 'chair', position: { x: 2, y: 0, z: 1 }, rotation: 0, scale: 1.3, price: 1500, unlockCondition: '레벨 3', description: '선장만의 특별한 의자' },
  
  // 수납
  { id: 10, name: '나무 상자', category: 'storage', position: { x: -2, y: 0, z: 0 }, rotation: 0, scale: 1, price: 120, unlockCondition: '기본', description: '간단한 수납 상자' },
  { id: 11, name: '옷장', category: 'storage', position: { x: -2, y: 0, z: 0 }, rotation: 0, scale: 1.3, price: 700, unlockCondition: '레벨 2', description: '옷을 보관하는 옷장' },
  { id: 12, name: '보물 창고', category: 'storage', position: { x: -2, y: 0, z: 0 }, rotation: 0, scale: 1.5, price: 2500, unlockCondition: '레벨 4', description: '귀중품을 보관하는 안전한 창고' },
  
  // 장식
  { id: 13, name: '조개껍데기', category: 'decoration', position: { x: 3, y: 1, z: 0 }, rotation: 0, scale: 0.5, price: 50, unlockCondition: '기본', description: '아름다운 조개껍데기' },
  { id: 14, name: '산호 장식', category: 'decoration', position: { x: 3, y: 1, z: 0 }, rotation: 0, scale: 0.8, price: 300, unlockCondition: '레벨 2', description: '색색의 산호 장식' },
  { id: 15, name: '진주 목걸이', category: 'decoration', position: { x: 3, y: 1, z: 0 }, rotation: 0, scale: 0.6, price: 1000, unlockCondition: '레벨 3', description: '빛나는 진주 목걸이' },
  { id: 16, name: '고대 지도', category: 'decoration', position: { x: 0, y: 2, z: -2 }, rotation: 0, scale: 1, price: 2000, unlockCondition: '레벨 4', description: '옛날 바다 지도' },
  
  // 조명
  { id: 17, name: '등유 램프', category: 'lighting', position: { x: -3, y: 1.5, z: 0 }, rotation: 0, scale: 0.8, price: 100, unlockCondition: '기본', description: '따뜻한 빛을 내는 램프' },
  { id: 18, name: '발광 산호', category: 'lighting', position: { x: -3, y: 1.5, z: 0 }, rotation: 0, scale: 1, price: 500, unlockCondition: '레벨 2', description: '밤에 빛나는 산호' },
  { id: 19, name: '수정 램프', category: 'lighting', position: { x: -3, y: 1.5, z: 0 }, rotation: 0, scale: 1.2, price: 1500, unlockCondition: '레벨 3', description: '신비로운 수정 램프' },
  
  // 수족관
  { id: 20, name: '작은 수족관', category: 'aquarium', position: { x: 0, y: 1, z: 2 }, rotation: 0, scale: 1, price: 800, unlockCondition: '레벨 2', description: '작은 물고기를 키울 수 있는 수족관' },
  { id: 21, name: '중형 수족관', category: 'aquarium', position: { x: 0, y: 1, z: 2 }, rotation: 0, scale: 1.5, price: 2500, unlockCondition: '레벨 3', description: '여러 물고기를 키울 수 있는 수족관' },
  { id: 22, name: '대형 수족관', category: 'aquarium', position: { x: 0, y: 1, z: 2 }, rotation: 0, scale: 2, price: 8000, unlockCondition: '레벨 5', description: '큰 물고기도 키울 수 있는 대형 수족관' },
];

export class HomeBaseSystem {
  private houseState: HouseState;

  constructor() {
    this.houseState = {
      level: 1,
      unlockedFurniture: [1, 4, 7, 10, 13, 17], // 기본 가구
      placedFurniture: [],
      decorationPoints: 0,
    };
  }

  /**
   * 집 레벨 업그레이드
   */
  upgradeHouse(shells: number): { success: boolean; newShells?: number; reason?: string } {
    if (this.houseState.level >= 5) {
      return { success: false, reason: '최대 레벨입니다' };
    }

    const upgradeCost = this.getUpgradeCost();
    if (shells < upgradeCost) {
      return { success: false, reason: '자금이 부족합니다' };
    }

    this.houseState.level++;
    const newShells = shells - upgradeCost;

    // 새로운 가구 해금
    const newFurniture = FURNITURE_CATALOG.filter(f => 
      f.unlockCondition === `레벨 ${this.houseState.level}` &&
      !this.houseState.unlockedFurniture.includes(f.id)
    );
    
    newFurniture.forEach(f => this.houseState.unlockedFurniture.push(f.id));

    return { success: true, newShells };
  }

  /**
   * 가구 구매
   */
  buyFurniture(furnitureId: number, shells: number): { success: boolean; newShells?: number; reason?: string } {
    const furniture = FURNITURE_CATALOG.find(f => f.id === furnitureId);
    if (!furniture) {
      return { success: false, reason: '존재하지 않는 가구입니다' };
    }

    if (!this.houseState.unlockedFurniture.includes(furnitureId)) {
      return { success: false, reason: '아직 해금되지 않은 가구입니다' };
    }

    if (shells < furniture.price) {
      return { success: false, reason: '자금이 부족합니다' };
    }

    const newShells = shells - furniture.price;
    this.houseState.placedFurniture.push({ ...furniture });
    this.houseState.decorationPoints += 10;

    return { success: true, newShells };
  }

  /**
   * 가구 제거
   */
  removeFurniture(furnitureId: number): boolean {
    const index = this.houseState.placedFurniture.findIndex(f => f.id === furnitureId);
    if (index === -1) return false;

    this.houseState.placedFurniture.splice(index, 1);
    this.houseState.decorationPoints = Math.max(0, this.houseState.decorationPoints - 10);
    return true;
  }

  /**
   * 가구 위치 변경
   */
  moveFurniture(furnitureId: number, newPosition: { x: number; y: number; z: number }): boolean {
    const furniture = this.houseState.placedFurniture.find(f => f.id === furnitureId);
    if (!furniture) return false;

    furniture.position = newPosition;
    return true;
  }

  getUpgradeCost(): number {
    const costs = [0, 500, 2000, 8000, 30000];
    return costs[this.houseState.level] || 0;
  }

  getState(): HouseState {
    return { ...this.houseState };
  }

  getAvailableFurniture(): FurnitureItem[] {
    return FURNITURE_CATALOG.filter(f => 
      this.houseState.unlockedFurniture.includes(f.id)
    );
  }
}
