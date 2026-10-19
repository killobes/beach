// OCEAN GAIA V3.2 — Creature Behavior System
// 세션 B 소유 — Three.js import 금지

import type { SpeciesData, BehaviorPattern, Region } from '../data/species';
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
  schoolId: string | null;
  age: number; // seconds since spawn
  maxAge: number;
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
  | 'school_follow';

export interface SchoolState {
  id: string;
  speciesId: number;
  leaderUid: string;
  members: string[];
  centerX: number;
  centerZ: number;
  heading: number;
  speed: number;
}

export class CreatureBehaviorSystem {
  private schools: Map<string, SchoolState> = new Map();
  private schoolCounter = 0;

  updateBehavior(
    creature: CreatureState,
    species: SpeciesData,
    dtSec: number,
    diverPos: { x: number; y: number; z: number } | null,
    allCreatures: CreatureState[],
    hour: number
  ): void {
    creature.age += dtSec;

    // Despawn check
    if (creature.age > creature.maxAge) {
      creature.behaviorState = 'idle'; // will be cleaned up
      return;
    }

    const behaviors = species.behaviors;
    const distToDiver = diverPos
      ? this.distance3D(creature.x, creature.y, creature.z, diverPos.x, diverPos.y, diverPos.z)
      : Infinity;

    // Priority-based behavior selection
    if (this.shouldFlee(creature, species, distToDiver)) {
      this.behaviorFlee(creature, diverPos!, dtSec);
      return;
    }

    if (behaviors.includes('nocturnal') && this.isDaytime(hour)) {
      this.behaviorRest(creature, dtSec);
      return;
    }

    if (behaviors.includes('vertical_migration')) {
      this.behaviorVerticalMigration(creature, hour, dtSec);
      return;
    }

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

    if (behaviors.includes('active_hunter') && creature.hunger > 0.5) {
      const prey = this.findPrey(creature, allCreatures, species, 50);
      if (prey) {
        this.behaviorChase(creature, prey, dtSec);
        return;
      }
    }

    if (behaviors.includes('schooling') && creature.schoolId) {
      this.behaviorSchoolFollow(creature, dtSec);
      return;
    }

    if (behaviors.includes('territorial')) {
      this.behaviorTerritorial(creature, dtSec);
      return;
    }

    if (behaviors.includes('benthic') && Math.random() < 0.01) {
      creature.behaviorState = 'rest';
      this.behaviorRest(creature, dtSec);
      return;
    }

    // Default: patrol
    this.behaviorPatrol(creature, species, dtSec);
  }

  private shouldFlee(creature: CreatureState, species: SpeciesData, distToDiver: number): boolean {
    if (distToDiver > 30) return false;
    if (species.behaviors.includes('evasive')) return distToDiver < 20;
    if (species.behaviors.includes('ambush_predator')) return false; // ambushers don't flee
    if (species.rarity >= 4 && distToDiver < 10) return true;
    return distToDiver < 5 && species.avgWeightKg < 50;
  }

  private behaviorFlee(creature: CreatureState, diverPos: { x: number; y: number; z: number }, dtSec: number): void {
    creature.behaviorState = 'flee';
    creature.alertLevel = Math.min(1, creature.alertLevel + dtSec * 2);

    // Move away from diver
    const dx = creature.x - diverPos.x;
    const dz = creature.z - diverPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;

    const fleeSpeed = 5 + creature.alertLevel * 3;
    creature.heading = Math.atan2(dx, dz);
    creature.x += Math.sin(creature.heading) * fleeSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * fleeSpeed * dtSec;

    // Also go deeper
    creature.y -= 2 * dtSec;
  }

  private behaviorPatrol(creature: CreatureState, species: SpeciesData, dtSec: number): void {
    creature.behaviorState = 'patrol';

    // Check if reached target
    const distToTarget = this.distance2D(creature.x, creature.z, creature.targetX, creature.targetZ);
    if (distToTarget < 5 || Math.random() < 0.005) {
      // Pick new target within region
      const bounds = WORLD_CONFIG.regions[species.region];
      creature.targetX = bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin);
      creature.targetZ = bounds.zMin + Math.random() * (bounds.zMax - bounds.zMin);
      creature.targetY = -(species.depthMinM + Math.random() * (species.depthMaxM - species.depthMinM));
    }

    // Move toward target
    const dx = creature.targetX - creature.x;
    const dz = creature.targetZ - creature.z;
    creature.heading = Math.atan2(dx, dz);

    const patrolSpeed = 1 + Math.random() * 0.5;
    creature.x += Math.sin(creature.heading) * patrolSpeed * dtSec;
    creature.z += Math.cos(creature.heading) * patrolSpeed * dtSec;

    // Gradual depth change
    const dy = creature.targetY - creature.y;
    creature.y += dy * 0.1 * dtSec;
  }

  private behaviorRest(creature: CreatureState, dtSec: number): void {
    creature.behaviorState = 'rest';
    creature.speed = 0;
    // Slight drift
    creature.x += Math.sin(creature.heading) * 0.1 * dtSec;
    creature.z += Math.cos(creature.heading) * 0.1 * dtSec;
  }

  private behaviorVerticalMigration(creature: CreatureState, hour: number, dtSec: number): void {
    // Move up at night, down during day
    const isNight = hour < 6 || hour > 18;
    creature.behaviorState = isNight ? 'migrate_up' : 'migrate_down';

    const targetDepth = isNight ? -20 : -200;
    const dy = targetDepth - creature.y;
    creature.y += dy * 0.5 * dtSec;

    // Also patrol horizontally
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

    // Strike toward nearest target
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

    // Return to ambush after 2 seconds
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

    // Move toward school center with some offset
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

    // Stay near home position, circle around
    const distFromHome = this.distance2D(creature.x, creature.z, creature.targetX, creature.targetZ);
    if (distFromHome > 20) {
      // Return home
      const dx = creature.targetX - creature.x;
      const dz = creature.targetZ - creature.z;
      creature.heading = Math.atan2(dx, dz);
      creature.x += Math.sin(creature.heading) * 2 * dtSec;
      creature.z += Math.cos(creature.heading) * 2 * dtSec;
    } else {
      // Circle
      creature.heading += 0.3 * dtSec;
      creature.x += Math.sin(creature.heading) * 0.5 * dtSec;
      creature.z += Math.cos(creature.heading) * 0.5 * dtSec;
    }
  }

  // School management
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
    };

    this.schools.set(id, school);
    return school;
  }

  updateSchools(dtSec: number): void {
    for (const [id, school] of this.schools) {
      // Move school center
      school.heading += (Math.random() - 0.5) * 0.1 * dtSec;
      school.centerX += Math.sin(school.heading) * school.speed * dtSec;
      school.centerZ += Math.cos(school.heading) * school.speed * dtSec;

      // Keep in world bounds
      school.centerX = Math.max(100, Math.min(WORLD_CONFIG.widthM - 100, school.centerX));
      school.centerZ = Math.max(100, Math.min(WORLD_CONFIG.heightM - 100, school.centerZ));
    }
  }

  removeSchool(id: string): void {
    this.schools.delete(id);
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

  private isDaytime(hour: number): boolean {
    return hour >= 6 && hour <= 18;
  }

  private distance2D(x1: number, z1: number, x2: number, z2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  }

  private distance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
  }
}
