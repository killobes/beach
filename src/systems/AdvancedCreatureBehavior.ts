// OCEAN GAIA V3.2 — Advanced Creature Behavior System
// 세션 B 소유 — Three.js import 금지
// 실제 생태계를 반영한 정교한 물고기 AI

import type { SpeciesData, BehaviorPattern, Region, HabitatType } from '../data/species';
import { WORLD_CONFIG } from '../data/world';

export interface CreatureState {
  uid: string;
  speciesId: number;
  x: number;
  y: number; // depth (negative)
  z: number;
  heading: number; // radians
  speed: number; // m/s
  behaviorState: BehaviorState;
  targetX: number;
  targetZ: number;
  targetY: number;
  alertLevel: number; // 0-1
  hunger: number; // 0-1
  energy: number; // 0-1
  schoolId: string | null;
  age: number; // seconds since spawn
  maxAge: number;
  lastFedTime: number;
  homeRange: { centerX: number; centerZ: number; radius: number };
}

export type BehaviorState =
  | 'idle'
  | 'patrol'
  | 'flee'
  | 'chase'
  | 'ambush_wait'
  | 'ambush_strike'
  | 'rest'
  | 'feed'
  | 'migrate_up'
  | 'migrate_down'
  | 'territorial'
  | 'school_follow'
  | 'explore'
  | 'return_home';

export interface SchoolState {
  id: string;
  speciesId: number;
  leaderUid: string;
  members: string[];
  centerX: number;
  centerZ: number;
  heading: number;
  speed: number;
  formation: 'line' | 'sphere' | 'loose';
}

export class AdvancedCreatureBehaviorSystem {
  private schools: Map<string, SchoolState> = new Map();
  private schoolCounter = 0;

  updateBehavior(
    creature: CreatureState,
    species: SpeciesData,
    dtSec: number,
    diverPos: { x: number; y: number; z: number } | null,
    allCreatures: CreatureState[],
    hour: number,
    season: string
  ): void {
    creature.age += dtSec;

    // Despawn check
    if (creature.age > creature.maxAge) {
      creature.behaviorState = 'idle';
      return;
    }

    // Energy and hunger management
    creature.hunger = Math.min(1, creature.hunger + dtSec * 0.001);
    creature.energy = Math.max(0, creature.energy - dtSec * 0.0005);

    const behaviors = species.behaviors;
    const distToDiver = diverPos
      ? this.distance3D(creature.x, creature.y, creature.z, diverPos.x, diverPos.y, diverPos.z)
      : Infinity;

    // Priority 1: Survival - Flee from danger
    if (this.shouldFlee(creature, species, distToDiver)) {
      this.behaviorFlee(creature, diverPos!, dtSec);
      return;
    }

    // Priority 2: Time-based behavior (nocturnal/diurnal)
    if (this.shouldRest(creature, species, hour)) {
      this.behaviorRest(creature, dtSec);
      return;
    }

    // Priority 3: Hunger - Find food
    if (creature.hunger > 0.6 && this.isFeedingTime(creature, species)) {
      if (this.tryFeed(creature, species, allCreatures, dtSec)) {
        return;
      }
    }

    // Priority 4: Vertical migration
    if (behaviors.includes('vertical_migration')) {
      this.behaviorVerticalMigration(creature, hour, dtSec);
      return;
    }

    // Priority 5: Ambush predator behavior
    if (behaviors.includes('ambush_predator') && creature.behaviorState === 'ambush_wait') {
      if (distToDiver < 5 || this.hasPreyNearby(creature, allCreatures, 8)) {
        creature.behaviorState = 'ambush_strike';
      } else {
        this.behaviorRest(creature, dtSec);
      }
      return;
    }

    if (creature.behaviorState === 'ambush_strike') {
      this.behaviorAmbushStrike(creature, diverPos, allCreatures, dtSec);
      return;
    }

    // Priority 6: Active hunting
    if (behaviors.includes('active_hunter') && creature.hunger > 0.5) {
      const prey = this.findPrey(creature, allCreatures, species, 50);
      if (prey) {
        this.behaviorChase(creature, prey, dtSec);
        return;
      }
    }

    // Priority 7: Schooling behavior
    if (behaviors.includes('schooling') && creature.schoolId) {
      this.behaviorSchoolFollow(creature, dtSec);
      return;
    }

    // Priority 8: Territorial behavior
    if (behaviors.includes('territorial')) {
      this.behaviorTerritorial(creature, dtSec);
      return;
    }

    // Priority 9: Home range behavior
    if (this.isOutsideHomeRange(creature)) {
      this.behaviorReturnHome(creature, dtSec);
      return;
    }

    // Priority 10: Exploration
    if (Math.random() < 0.01) {
      this.behaviorExplore(creature, species, dtSec);
      return;
    }

    // Default: Patrol
    this.behaviorPatrol(creature, species, dtSec);
  }

  private shouldFlee(creature: CreatureState, species: SpeciesData, distToDiver: number): boolean {
    if (distToDiver > 30) return false;
    if (species.behaviors.includes('evasive')) return distToDiver < 20;
    if (species.behaviors.includes('ambush_predator')) return false;
    if (species.rarity >= 4 && distToDiver < 10) return true;
    return distToDiver < 5 && species.avgWeightKg < 50;
  }

  private shouldRest(creature: CreatureState, species: SpeciesData, hour: number): boolean {
    const isNocturnal = species.behaviors.includes('nocturnal');
    const isDaytime = hour >= 6 && hour <= 18;
    
    if (isNocturnal && isDaytime) return true;
    if (!isNocturnal && !isDaytime) return creature.energy < 0.3;
    
    return false;
  }

  private isFeedingTime(creature: CreatureState, species: SpeciesData): boolean {
    const timeSinceLastFed = creature.age - creature.lastFedTime;
    return timeSinceLastFed > 60; // Feed every minute
  }

  private tryFeed(creature: CreatureState, species: SpeciesData, allCreatures: CreatureState[], dtSec: number): boolean {
    // Filter feeders
    if (species.behaviors.includes('filter_feeder') || species.behaviors.includes('planktivore')) {
      creature.behaviorState = 'feed';
      creature.hunger = Math.max(0, creature.hunger - dtSec * 0.01);
      creature.lastFedTime = creature.age;
      return true;
    }

    // Grazers
    if (species.behaviors.includes('grazer') || species.behaviors.includes('herbivore')) {
      creature.behaviorState = 'feed';
      creature.hunger = Math.max(0, creature.hunger - dtSec * 0.01);
      creature.lastFedTime = creature.age;
      return true;
    }

    // Predators - find prey
    if (species.behaviors.includes('active_hunter') || species.behaviors.includes('piscivore')) {
      const prey = this.findPrey(creature, allCreatures, species, 50);
      if (prey) {
        this.behaviorChase(creature, prey, dtSec);
        return true;
      }
    }

    // Ambush predators
    if (species.behaviors.includes('ambush_predator')) {
      creature.behaviorState = 'ambush_wait';
      return true;
    }

    return false;
  }

  private behaviorFlee(creature: CreatureState, diverPos: { x: number; y: number; z: number }, dtSec: number): void {
    creature.behaviorState = 'flee';
    creature.alertLevel = Math.min(1, creature.alertLevel + dtSec * 2);

    const dx = creature.x - diverPos.x;
    const dz = creature.z - diverPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;

    const fleeSpeed = 5 + creature.alertLevel * 3;
    creature.heading = Math.atan2(dx, dz);
    creature.x += Math.sin(creature.heading) * fleeSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * fleeSpeed * dtSec;
    creature.y -= 2 * dtSec;
  }

  private behaviorRest(creature: CreatureState, dtSec: number): void {
    creature.behaviorState = 'rest';
    creature.speed = 0;
    creature.energy = Math.min(1, creature.energy + dtSec * 0.01);
    
    creature.x += Math.sin(creature.heading) * 0.1 * dtSec;
    creature.z += Math.cos(creature.heading) * 0.1 * dtSec;
  }

  private behaviorVerticalMigration(creature: CreatureState, hour: number, dtSec: number): void {
    const isNight = hour < 6 || hour > 18;
    creature.behaviorState = isNight ? 'migrate_up' : 'migrate_down';

    const targetDepth = isNight ? -20 : -200;
    const dy = targetDepth - creature.y;
    creature.y += dy * 0.5 * dtSec;

    const distToTarget = this.distance2D(creature.x, creature.z, creature.targetX, creature.targetZ);
    if (distToTarget < 10) {
      creature.targetX = creature.x + (Math.random() - 0.5) * 100;
      creature.targetZ = creature.z + (Math.random() - 0.5) * 100;
    }
    const dx = creature.targetX - creature.x;
    const dz = creature.targetZ - creature.z;
    creature.heading = Math.atan2(dx, dz);
    creature.x += Math.sin(creature.heading) * 1.5 * dtSec;
    creature.z += Math.cos(creature.heading) * 1.5 * dtSec;
  }

  private behaviorAmbushStrike(creature: CreatureState, diverPos: { x: number; y: number; z: number } | null, allCreatures: CreatureState[], dtSec: number): void {
    creature.behaviorState = 'ambush_strike';
    const strikeSpeed = 8;

    let targetX = creature.x;
    let targetZ = creature.z;

    if (diverPos && this.distance3D(creature.x, creature.y, creature.z, diverPos.x, diverPos.y, diverPos.z) < 8) {
      targetX = diverPos.x;
      targetZ = diverPos.z;
    }

    const dx = targetX - creature.x;
    const dz = targetZ - creature.z;
    creature.heading = Math.atan2(dx, dz);
    creature.x += Math.sin(creature.heading) * strikeSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * strikeSpeed * dtSec;

    if (Math.random() < 0.02) {
      creature.behaviorState = 'ambush_wait';
    }
  }

  private behaviorChase(creature: CreatureState, prey: CreatureState, dtSec: number): void {
    creature.behaviorState = 'chase';
    const dx = prey.x - creature.x;
    const dz = prey.z - creature.z;
    creature.heading = Math.atan2(dx, dz);

    const chaseSpeed = 4;
    creature.x += Math.sin(creature.heading) * chaseSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * chaseSpeed * dtSec;

    const dy = prey.y - creature.y;
    creature.y += dy * 0.3 * dtSec;
  }

  private behaviorSchoolFollow(creature: CreatureState, dtSec: number): void {
    creature.behaviorState = 'school_follow';
    const school = this.schools.get(creature.schoolId!);
    if (!school) {
      creature.schoolId = null;
      this.behaviorPatrol(creature, { region: 'ocean' } as SpeciesData, dtSec);
      return;
    }

    const offsetX = Math.sin(creature.age * 0.5 + parseFloat(creature.uid.slice(-4))) * 5;
    const offsetZ = Math.cos(creature.age * 0.5 + parseFloat(creature.uid.slice(-4))) * 5;

    const targetX = school.centerX + offsetX;
    const targetZ = school.centerZ + offsetZ;

    const dx = targetX - creature.x;
    const dz = targetZ - creature.z;
    creature.heading = Math.atan2(dx, dz);

    const schoolSpeed = school.speed;
    creature.x += Math.sin(creature.heading) * schoolSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * schoolSpeed * dtSec;
  }

  private behaviorTerritorial(creature: CreatureState, dtSec: number): void {
    creature.behaviorState = 'territorial';

    const distFromHome = this.distance2D(creature.x, creature.z, creature.targetX, creature.targetZ);
    if (distFromHome > 20) {
      const dx = creature.targetX - creature.x;
      const dz = creature.targetZ - creature.z;
      creature.heading = Math.atan2(dx, dz);
      creature.x += Math.sin(creature.heading) * 2 * dtSec;
      creature.z += Math.cos(creature.heading) * 2 * dtSec;
    } else {
      creature.heading += 0.3 * dtSec;
      creature.x += Math.sin(creature.heading) * 0.5 * dtSec;
      creature.z += Math.cos(creature.heading) * 0.5 * dtSec;
    }
  }

  private behaviorPatrol(creature: CreatureState, species: SpeciesData, dtSec: number): void {
    creature.behaviorState = 'patrol';

    const distToTarget = this.distance2D(creature.x, creature.z, creature.targetX, creature.targetZ);
    if (distToTarget < 5 || Math.random() < 0.005) {
      const bounds = WORLD_CONFIG.regions[species.region];
      creature.targetX = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
      creature.targetZ = bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin);
      creature.targetY = -(species.depthMinM + Math.random() * (species.depthMaxM - species.depthMinM));
    }

    const dx = creature.targetX - creature.x;
    const dz = creature.targetZ - creature.z;
    creature.heading = Math.atan2(dx, dz);

    const patrolSpeed = 1 + Math.random() * 0.5;
    creature.x += Math.sin(creature.heading) * patrolSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * patrolSpeed * dtSec;

    const dy = creature.targetY - creature.y;
    creature.y += dy * 0.1 * dtSec;
  }

  private behaviorExplore(creature: CreatureState, species: SpeciesData, dtSec: number): void {
    creature.behaviorState = 'explore';
    
    const exploreRadius = 100;
    creature.targetX = creature.homeRange.centerX + (Math.random() - 0.5) * exploreRadius;
    creature.targetZ = creature.homeRange.centerZ + (Math.random() - 0.5) * exploreRadius;
    
    const dx = creature.targetX - creature.x;
    const dz = creature.targetZ - creature.z;
    creature.heading = Math.atan2(dx, dz);
    
    const exploreSpeed = 1.5;
    creature.x += Math.sin(creature.heading) * exploreSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * exploreSpeed * dtSec;
  }

  private behaviorReturnHome(creature: CreatureState, dtSec: number): void {
    creature.behaviorState = 'return_home';
    
    const dx = creature.homeRange.centerX - creature.x;
    const dz = creature.homeRange.centerZ - creature.z;
    creature.heading = Math.atan2(dx, dz);
    
    const returnSpeed = 2;
    creature.x += Math.sin(creature.heading) * returnSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * returnSpeed * dtSec;
  }

  private isOutsideHomeRange(creature: CreatureState): boolean {
    const dist = this.distance2D(creature.x, creature.z, creature.homeRange.centerX, creature.homeRange.centerZ);
    return dist > creature.homeRange.radius;
  }

  private hasPreyNearby(creature: CreatureState, allCreatures: CreatureState[], range: number): boolean {
    return allCreatures.some(c =>
      c.uid !== creature.uid &&
      this.distance3D(creature.x, creature.y, creature.z, c.x, c.y, c.z) < range
    );
  }

  private findPrey(creature: CreatureState, allCreatures: CreatureState[], species: SpeciesData, range: number): CreatureState | null {
    let closest: CreatureState | null = null;
    let closestDist = range;

    for (const c of allCreatures) {
      if (c.uid === creature.uid) continue;
      const dist = this.distance3D(creature.x, creature.y, creature.z, c.x, c.y, c.z);
      if (dist < closestDist) {
        closest = c;
        closestDist = dist;
      }
    }

    return closest;
  }

  createSchool(speciesId: number, members: CreatureState[]): SchoolState {
    const id = `school_${++this.schoolCounter}`;
    const centerX = members.reduce((s, m) => s + m.x, 0) / members.length;
    const centerZ = members.reduce((s, m) => s + m.z, 0) / members.length;

    const school: SchoolState = {
      id,
      speciesId,
      leaderUid: members[0].uid,
      members: members.map(m => m.uid),
      centerX,
      centerZ,
      heading: Math.random() * Math.PI * 2,
      speed: 2,
      formation: 'loose',
    };

    this.schools.set(id, school);
    return school;
  }

  updateSchools(dtSec: number): void {
    for (const [id, school] of this.schools) {
      school.heading += (Math.random() - 0.5) * 0.1 * dtSec;
      school.centerX += Math.sin(school.heading) * school.speed * dtSec;
      school.centerZ += Math.cos(school.heading) * school.speed * dtSec;

      school.centerX = Math.max(100, Math.min(WORLD_CONFIG.widthM - 100, school.centerX));
      school.centerZ = Math.max(100, Math.min(WORLD_CONFIG.heightM - 100, school.centerZ));
    }
  }

  removeSchool(id: string): void {
    this.schools.delete(id);
  }

  private distance2D(x1: number, z1: number, x2: number, z2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  }

  private distance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
  }
}
