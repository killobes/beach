// OCEAN GAIA V3.2 — Session A Adapter
// 세션 A(Three.js)가 세션 B의 게임 엔진과 통합하기 위한 어댑터
// 세션 B 소유 — Three.js import 금지

import type { GameState, Specimen } from '../core/GameEngine';
import { SPECIES_BY_ID } from '../data/species';
import { WORLD_CONFIG } from '../data/world';

/**
 * Vector3 호환 포지션 (세션 A의 Three.js Vector3와 호환)
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 선박 상태 (세션 A용)
 */
export interface ShipState {
  position: Position3D;
  heading: number; // radians
  level: number;
  speed: number; // m/s
}

/**
 * 잠수부 상태 (세션 A용)
 */
export interface DiverState {
  position: Position3D;
  heading: number; // radians
  inWater: boolean;
  airRemaining: number; // 0-100
}

/**
 * 생물 렌더링 데이터 (세션 A용)
 */
export interface CreatureRenderData {
  uid: string;
  speciesId: number;
  speciesName: string;
  position: Position3D;
  lengthCm: number;
  weightKg: number;
  behaviorState: string;
  scale: number; // 렌더링 스케일
  isProtected: boolean;
}

/**
 * 날씨 렌더링 데이터 (세션 A용)
 */
export interface WeatherRenderData {
  type: string;
  hour: number;
  isNight: boolean;
  visibility: number; // 0-1
  windSpeed: number; // m/s
  waveHeight: number; // m
}

/**
 * GameState를 세션 A 친화적 형태로 변환
 */
export function adaptForSessionA(state: GameState): {
  ship: ShipState;
  diver: DiverState;
  creatures: CreatureRenderData[];
  weather: WeatherRenderData;
  world: {
    widthM: number;
    heightM: number;
    seaLevel: number;
  };
  nearbyCreatures?: Array<CreatureRenderData & { distance: number }>;
} {
  // Ship
  const ship: ShipState = {
    position: {
      x: state.shipX,
      y: WORLD_CONFIG.seaLevel,
      z: state.shipZ,
    },
    heading: state.shipHeading,
    level: state.shipLevel,
    speed: 0, // Will be calculated by Session A based on ship level
  };

  // Diver
  const diver: DiverState = {
    position: {
      x: state.diverX,
      y: state.diverY, // negative = underwater
      z: state.diverZ,
    },
    heading: state.diverHeading,
    inWater: state.inWater,
    airRemaining: state.airRemaining,
  };

  // Creatures
  const creatures: CreatureRenderData[] = state.activeSpecimens.map(spec => {
    const species = SPECIES_BY_ID.get(spec.speciesId);
    return {
      uid: spec.uid,
      speciesId: spec.speciesId,
      speciesName: species?.name || 'Unknown',
      position: {
        x: spec.x,
        y: -spec.depthM, // negative = underwater
        z: spec.z,
      },
      lengthCm: spec.lengthCm,
      weightKg: spec.weightKg,
      behaviorState: spec.behaviorState,
      scale: spec.lengthCm / 100, // cm to m, approximate scale
      isProtected: species?.protected || false,
    };
  });

  // Weather
  const isNight = state.hour < 6 || state.hour > 18;
  const weather: WeatherRenderData = {
    type: state.weather,
    hour: state.hour,
    isNight,
    visibility: getWeatherVisibility(state.weather),
    windSpeed: getWeatherWindSpeed(state.weather),
    waveHeight: getWeatherWaveHeight(state.weather),
  };

  // World
  const world = {
    widthM: WORLD_CONFIG.widthM,
    heightM: WORLD_CONFIG.heightM,
    seaLevel: WORLD_CONFIG.seaLevel,
  };

  // Nearby creatures (for Session A convenience)
  let nearbyCreatures: Array<CreatureRenderData & { distance: number }> | undefined;
  if (state.inWater) {
    nearbyCreatures = creatures
      .map(c => ({
        ...c,
        distance: Math.sqrt(
          Math.pow(c.position.x - state.diverX, 2) +
          Math.pow(c.position.z - state.diverZ, 2)
        )
      }))
      .filter(c => c.distance <= 50) // 50m 반경
      .sort((a, b) => a.distance - b.distance);
  }

  return { ship, diver, creatures, weather, world, nearbyCreatures };
}

/**
 * 날씨별 시야 거리 (0-1)
 */
function getWeatherVisibility(weather: string): number {
  switch (weather) {
    case 'clear': return 1.0;
    case 'cloudy': return 0.8;
    case 'rain': return 0.6;
    case 'storm': return 0.3;
    case 'fog': return 0.2;
    case 'snow': return 0.5;
    default: return 1.0;
  }
}

/**
 * 날씨별 풍속 (m/s)
 */
function getWeatherWindSpeed(weather: string): number {
  switch (weather) {
    case 'clear': return 5;
    case 'cloudy': return 8;
    case 'rain': return 15;
    case 'storm': return 30;
    case 'fog': return 3;
    case 'snow': return 12;
    default: return 5;
  }
}

/**
 * 날씨별 파고 (m)
 */
function getWeatherWaveHeight(weather: string): number {
  switch (weather) {
    case 'clear': return 0.3;
    case 'cloudy': return 0.5;
    case 'rain': return 1.0;
    case 'storm': return 3.0;
    case 'fog': return 0.4;
    case 'snow': return 0.8;
    default: return 0.3;
  }
}

/**
 * 생물 행동 상태에 따른 애니메이션 타입
 */
export function getAnimationType(behaviorState: string): string {
  switch (behaviorState) {
    case 'patrol': return 'swim_normal';
    case 'flee': return 'swim_fast';
    case 'chase': return 'swim_fast';
    case 'ambush_wait': return 'idle';
    case 'ambush_strike': return 'attack';
    case 'rest': return 'idle';
    case 'feed': return 'feed';
    case 'migrate_up': return 'swim_normal';
    case 'migrate_down': return 'swim_normal';
    case 'territorial': return 'swim_normal';
    case 'school_follow': return 'swim_school';
    default: return 'swim_normal';
  }
}

/**
 * 세션 A에서 사용할 Three.js 변환 유틸리티
 * (실제 Three.js 코드는 세션 A에서 작성)
 */
export const ThreeJSUtils = {
  /**
   * Position3D를 Three.js Vector3로 변환하는 예제
   * 세션 A에서 실제 구현:
   * 
   * import * as THREE from 'three';
   * const vector = new THREE.Vector3(pos.x, pos.y, pos.z);
   */
  positionToVector3: (pos: Position3D): { x: number; y: number; z: number } => {
    return { x: pos.x, y: pos.y, z: pos.z };
  },

  /**
   * 라디안을 각도로 변환
   */
  radToDeg: (rad: number): number => {
    return rad * (180 / Math.PI);
  },

  /**
   * 각도를 라디안으로 변환
   */
  degToRad: (deg: number): number => {
    return deg * (Math.PI / 180);
  },
};
