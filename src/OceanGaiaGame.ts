// OCEAN GAIA V3.2 — Complete Session A Integration Example
// 세션 A가 바로 사용할 수 있는 완전한 통합 예제

import * as THREE from 'three';
import { createGame } from './core/GameEngine';
import { adaptForSessionA } from './systems/SessionAAdapter';
import { OceanZoneSystem } from './systems/OceanZone';
import { SeabedTerrainSystem } from './systems/SeabedTerrain';
import { TutorialSystem, createTutorialUIData } from './systems/TutorialSystem';
import { GameBalanceSystem } from './systems/GameBalance';
import { createStartingIsland } from './models/StartingIsland';
import { createPlayerHouse } from './models/PlayerHouse';
import { createDiverCharacter } from './models/DiverCharacter';
import { createShip } from './models/Ship';
import { createIsland } from './models/IslandModel';
import { SPECIES_BY_ID } from './data/species';

/**
 * 완전한 게임 씬 클래스
 */
export class OceanGaiaGame {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private game: ReturnType<typeof createGame>;
  private oceanZone: OceanZoneSystem;
  private seabedTerrain: SeabedTerrainSystem;
  private tutorial: TutorialSystem;
  private balance: GameBalanceSystem;
  private clock: THREE.Clock;
  
  // 3D 모델
  private shipModel: THREE.Group | null = null;
  private diverModel: ReturnType<typeof createDiverCharacter> | null = null;
  private islandModels: Map<number, THREE.Group> = new Map();
  private creatureModels: Map<string, THREE.Group> = new Map();
  
  // UI 콜백
  private onTutorialUpdate: ((data: any) => void) | null = null;
  private onGameStateUpdate: ((state: any) => void) | null = null;
  
  constructor(container: HTMLElement) {
    // Three.js 초기화
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      10000
    );
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    // 게임 시스템 초기화
    this.game = createGame({ seed: 12345 });
    this.oceanZone = new OceanZoneSystem(this.scene);
    this.seabedTerrain = new SeabedTerrainSystem();
    this.tutorial = new TutorialSystem();
    this.balance = new GameBalanceSystem();
    
    // 조명 설정
    this.setupLighting();
    
    // 초기 객체 추가
    this.setupInitialObjects();
    
    // 튜토리얼 시작
    this.tutorial.start(() => {
      console.log('✅ 튜토리얼 완료!');
    });
    
    this.clock = new THREE.Clock();
    
    // 윈도우 리사이즈 처리
    window.addEventListener('resize', () => this.onResize(container));
    
    // 키보드 입력 처리
    this.setupInputHandlers();
  }
  
  private setupLighting(): void {
    // 환경광
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // 태양광
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    this.scene.add(sunLight);
    
    // 반구광
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b6f47, 0.3);
    this.scene.add(hemiLight);
  }
  
  private setupInitialObjects(): void {
    // 시작 섬 추가
    const startingIsland = createStartingIsland();
    const islandModel = startingIsland.getModel();
    islandModel.position.set(1500, 0, 1500);
    this.scene.add(islandModel);
    this.islandModels.set(1, islandModel);
    
    // 플레이어 집 추가
    const playerHouse = createPlayerHouse(1);
    const houseModel = playerHouse.getModel();
    houseModel.position.set(1510, 0, 1510);
    this.scene.add(houseModel);
    
    // 선박 추가
    const ship = createShip(1);
    this.shipModel = ship.getModel();
    this.shipModel.position.set(1500, 0, 1520);
    this.scene.add(this.shipModel);
    
    // 잠수사 추가
    this.diverModel = createDiverCharacter(1, 1, 1);
    const diverGroup = this.diverModel.getModel();
    diverGroup.position.set(1500, 0, 1525);
    diverGroup.visible = false;
    this.scene.add(diverGroup);
    
    // 해저 지형 추가
    this.scene.add(this.seabedTerrain.getModel());
  }
  
  private setupInputHandlers(): void {
    window.addEventListener('keydown', (e) => {
      const state = this.game.getSnapshot();
      
      switch (e.key.toLowerCase()) {
        case 'w':
          if (state.inWater) {
            this.game.dispatch({ type: 'MOVE_DIVER', forward: 1, turn: 0, vertical: 0, dtSec: 0.1 });
          } else {
            this.game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 0.1 });
          }
          break;
        case 's':
          if (state.inWater) {
            this.game.dispatch({ type: 'MOVE_DIVER', forward: -1, turn: 0, vertical: 0, dtSec: 0.1 });
          } else {
            this.game.dispatch({ type: 'MOVE_SHIP', forward: -1, turn: 0, dtSec: 0.1 });
          }
          break;
        case 'a':
          if (state.inWater) {
            this.game.dispatch({ type: 'MOVE_DIVER', forward: 0, turn: -1, vertical: 0, dtSec: 0.1 });
          } else {
            this.game.dispatch({ type: 'MOVE_SHIP', forward: 0, turn: -1, dtSec: 0.1 });
          }
          break;
        case 'd':
          if (state.inWater) {
            this.game.dispatch({ type: 'MOVE_DIVER', forward: 0, turn: 1, vertical: 0, dtSec: 0.1 });
          } else {
            this.game.dispatch({ type: 'MOVE_SHIP', forward: 0, turn: 1, dtSec: 0.1 });
          }
          break;
        case 'e':
          this.game.dispatch({ type: 'ENTER_WATER' });
          break;
        case 'q':
          this.game.dispatch({ type: 'RETURN_TO_SHIP' });
          break;
        case ' ':
          this.tryCatchNearestCreature();
          break;
        case 'f':
          this.tryObserveNearestCreature();
          break;
      }
    });
  }
  
  private tryCatchNearestCreature(): void {
    const state = this.game.getSnapshot();
    if (!state.inWater) return;
    
    const nearby = this.game.getNearbySpecimens(state.diverX, state.diverZ, 50);
    if (nearby.length === 0) {
      console.log('주변에 물고기가 없습니다');
      return;
    }
    
    const target = nearby[0];
    const result = this.game.dispatch({
      type: 'CATCH_ATTEMPT',
      specimenId: target.uid,
    });
    
    if (result.success) {
      const data = result.data as any;
      console.log(`✅ ${data.species} 포획 성공!`);
      console.log(`   크기: ${data.length}cm, 무게: ${data.weight}kg`);
      console.log(`   가치: ${data.value} 조개`);
    } else {
      console.log(`❌ 포획 실패: ${result.reason}`);
    }
  }
  
  private tryObserveNearestCreature(): void {
    const state = this.game.getSnapshot();
    if (!state.inWater) return;
    
    const nearby = this.game.getNearbySpecimens(state.diverX, state.diverZ, 50);
    if (nearby.length === 0) {
      console.log('주변에 물고기가 없습니다');
      return;
    }
    
    const target = nearby[0];
    const result = this.game.dispatch({
      type: 'OBSERVE_CREATURE',
      specimenId: target.uid,
    });
    
    if (result.success) {
      const data = result.data as any;
      console.log(`✅ ${data.species} 관찰 성공!`);
    } else {
      console.log(`❌ 관찰 실패: ${result.reason}`);
    }
  }
  
  /**
   * 게임 시작
   */
  start(): void {
    console.log('🎮 OCEAN GAIA V3.2 시작!');
    console.log('조작법:');
    console.log('  W/S: 전진/후진');
    console.log('  A/D: 좌회전/우회전');
    console.log('  E: 입수');
    console.log('  Q: 귀선');
    console.log('  Space: 포획');
    console.log('  F: 관찰');
    
    this.animate();
  }
  
  /**
   * 애니메이션 루프
   */
  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // 1. 게임 상태 업데이트
    this.game.dispatch({ type: 'TICK', dtSec: deltaTime });
    
    // 2. 세션 A용 데이터로 변환
    const gameState = this.game.getSnapshot();
    const adapted = adaptForSessionA(gameState);
    
    // 3. 튜토리얼 업데이트
    const tutorialResult = this.tutorial.update(gameState);
    if (tutorialResult.completed) {
      const currentStep = this.tutorial.getCurrentStep();
      if (currentStep && this.onTutorialUpdate) {
        const uiData = createTutorialUIData(currentStep, this.tutorial.getProgress());
        this.onTutorialUpdate(uiData);
      }
    }
    
    // 4. 해역 환경 업데이트
    this.oceanZone.updateRegionFromPosition(
      adapted.ship.position.x,
      adapted.ship.position.z
    );
    
    // 5. 바다 애니메이션
    this.oceanZone.updateWaterAnimation(elapsedTime);
    
    // 6. Three.js 씬 업데이트
    this.updateScene(adapted, deltaTime);
    
    // 7. 카메라 업데이트
    this.updateCamera(adapted);
    
    // 8. 렌더링
    this.renderer.render(this.scene, this.camera);
    
    // 9. UI 업데이트 콜백
    if (this.onGameStateUpdate) {
      this.onGameStateUpdate(gameState);
    }
  }
  
  /**
   * 씬 업데이트
   */
  private updateScene(adapted: any, deltaTime: number): void {
    // 선박 업데이트
    if (this.shipModel) {
      this.shipModel.position.set(
        adapted.ship.position.x,
        adapted.ship.position.y,
        adapted.ship.position.z
      );
      this.shipModel.rotation.y = adapted.ship.heading;
      
      // 파도에 따른 흔들림
      const waveOffset = Math.sin(this.clock.getElapsedTime() * 0.5) * 0.2;
      this.shipModel.position.y = adapted.ship.position.y + waveOffset;
    }
    
    // 잠수부 업데이트
    if (this.diverModel) {
      const diverGroup = this.diverModel.getModel();
      if (adapted.diver.inWater) {
        diverGroup.visible = true;
        diverGroup.position.set(
          adapted.diver.position.x,
          adapted.diver.position.y,
          adapted.diver.position.z
        );
        diverGroup.rotation.y = adapted.diver.heading;
        
        // 잠수사 애니메이션
        this.diverModel.setSwimming(true);
        this.diverModel.update(deltaTime);
      } else {
        diverGroup.visible = false;
        this.diverModel.setSwimming(false);
      }
    }
    
    // 생물 업데이트
    this.updateCreatures(adapted.creatures, deltaTime);
  }
  
  /**
   * 생물 업데이트
   */
  private updateCreatures(creatures: any[], deltaTime: number): void {
    // 기존 생물 중 제거된 것 삭제
    const currentIds = new Set(creatures.map((c: any) => c.uid));
    this.creatureModels.forEach((model, uid) => {
      if (!currentIds.has(uid)) {
        this.scene.remove(model);
        this.creatureModels.delete(uid);
      }
    });
    
    // 새 생물 추가 또는 기존 생물 업데이트
    creatures.forEach((creature: any) => {
      let model = this.creatureModels.get(creature.uid);
      
      if (!model) {
        // 새 생물 모델 생성
        model = this.createCreatureModel(creature);
        this.creatureModels.set(creature.uid, model);
        this.scene.add(model);
      }
      
      // 위치 업데이트
      model.position.set(
        creature.position.x,
        creature.position.y,
        creature.position.z
      );
      
      // 크기 업데이트
      model.scale.setScalar(creature.scale);
      
      // 행동에 따른 애니메이션
      this.animateCreature(model, creature.behaviorState, deltaTime);
    });
  }
  
  /**
   * 생물 모델 생성
   */
  private createCreatureModel(creature: any): THREE.Group {
    const species = SPECIES_BY_ID.get(creature.speciesId);
    const group = new THREE.Group();
    
    // 간단한 물고기 모델
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: species ? this.getSpeciesColor(species) : 0x4169e1,
      roughness: 0.6,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    group.add(body);
    
    // 꼬리
    const tailGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.x = -0.7;
    tail.rotation.z = Math.PI / 2;
    group.add(tail);
    
    return group;
  }
  
  /**
   * 종별 색상 반환
   */
  private getSpeciesColor(species: any): number {
    // 간단한 색상 매핑
    const colors: Record<string, number> = {
      tropical: 0xff6b9d,
      glacier: 0x87ceeb,
      volcanic: 0xff4500,
      mangrove: 0x2e8b57,
      ocean: 0x4169e1,
      deepsea: 0x191970,
    };
    return colors[species.region] || 0x4169e1;
  }
  
  /**
   * 생물 애니메이션
   */
  private animateCreature(model: THREE.Group, behaviorState: string, deltaTime: number): void {
    const time = this.clock.getElapsedTime();
    
    switch (behaviorState) {
      case 'patrol':
        model.rotation.y += deltaTime * 0.5;
        break;
      case 'flee':
        model.rotation.y += deltaTime * 2;
        break;
      case 'chase':
        model.rotation.y += deltaTime * 1.5;
        break;
      case 'idle':
      case 'rest':
        model.position.y += Math.sin(time * 2) * 0.01;
        break;
    }
    
    // 꼬리 흔들기
    const tail = model.children[1];
    if (tail) {
      tail.rotation.y = Math.sin(time * 5) * 0.3;
    }
  }
  
  /**
   * 카메라 업데이트
   */
  private updateCamera(adapted: any): void {
    const offset = new THREE.Vector3(0, 30, -50);
    const targetPosition = new THREE.Vector3(
      adapted.ship.position.x + offset.x,
      adapted.ship.position.y + offset.y,
      adapted.ship.position.z + offset.z
    );
    
    this.camera.position.lerp(targetPosition, 0.05);
    this.camera.lookAt(
      adapted.ship.position.x,
      adapted.ship.position.y,
      adapted.ship.position.z
    );
  }
  
  /**
   * 윈도우 리사이즈 처리
   */
  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }
  
  /**
   * UI 콜백 설정
   */
  setTutorialCallback(callback: (data: any) => void): void {
    this.onTutorialUpdate = callback;
  }
  
  setGameStateCallback(callback: (state: any) => void): void {
    this.onGameStateUpdate = callback;
  }
  
  /**
   * 게임 상태 가져오기
   */
  getGameState() {
    return this.game.getSnapshot();
  }
  
  /**
   * 액션 실행
   */
  dispatch(action: any) {
    return this.game.dispatch(action);
  }
  
  /**
   * 저장
   */
  save() {
    return this.game.save();
  }
  
  /**
   * 불러오기
   */
  load() {
    return this.game.load();
  }
  
  /**
   * 밸런스 리포트
   */
  getBalanceReport() {
    return this.balance.generateBalanceReport();
  }
  
  /**
   * 튜토리얼 정보
   */
  getTutorialInfo() {
    return this.tutorial.getInfo();
  }
}

/**
 * 게임 생성 함수
 */
export function createOceanGaiaGame(container: HTMLElement): OceanGaiaGame {
  const game = new OceanGaiaGame(container);
  game.start();
  return game;
}
