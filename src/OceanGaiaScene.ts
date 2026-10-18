// OCEAN GAIA V3.2 — Session A Integration Example
// 세션 A가 바로 사용할 수 있는 완전한 통합 예제

import * as THREE from 'three';
import { createGame } from './core/GameEngine';
import { adaptForSessionA } from './systems/SessionAAdapter';
import { OceanZoneSystem } from './systems/OceanZone';
import { SeabedTerrainSystem } from './systems/SeabedTerrain';
import { createStartingIsland } from './models/StartingIsland';
import { createPlayerHouse } from './models/PlayerHouse';
import { createDiverCharacter } from './models/DiverCharacter';
import { createShip } from './models/Ship';
import { createAllIslands } from './models/IslandModel';

/**
 * 완전한 게임 씬 클래스
 */
export class OceanGaiaScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private game: ReturnType<typeof createGame>;
  private oceanZone: OceanZoneSystem;
  private seabedTerrain: SeabedTerrainSystem;
  private clock: THREE.Clock;
  
  // 3D 모델 참조
  private shipModel: THREE.Group | null = null;
  private diverModel: THREE.Group | null = null;
  private islandModels: Map<number, THREE.Group> = new Map();
  private creatureModels: Map<string, THREE.Group> = new Map();
  
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
    
    // 게임 엔진 초기화
    this.game = createGame({ seed: 12345 });
    
    // 환경 시스템 초기화
    this.oceanZone = new OceanZoneSystem(this.scene);
    this.seabedTerrain = new SeabedTerrainSystem();
    
    // 조명 설정
    this.setupLighting();
    
    // 초기 객체 추가
    this.setupInitialObjects();
    
    this.clock = new THREE.Clock();
    
    // 윈도우 리사이즈 처리
    window.addEventListener('resize', () => this.onResize(container));
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
    islandModel.position.set(1500, 0, 1500); // 산호항 위치
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
    const diver = createDiverCharacter(1, 1, 1);
    this.diverModel = diver.getModel();
    this.diverModel.position.set(1500, 0, 1525);
    this.diverModel.visible = false; // 초기에는 보이지 않음
    this.scene.add(this.diverModel);
    
    // 해저 지형 추가
    this.scene.add(this.seabedTerrain.getModel());
    
    // 모든 섬 추가 (선택적)
    // const allIslands = createAllIslands();
    // this.scene.add(allIslands);
  }
  
  /**
   * 게임 시작
   */
  start(): void {
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
    
    // 3. 해역 환경 업데이트
    this.oceanZone.updateRegionFromPosition(
      adapted.ship.position.x,
      adapted.ship.position.z
    );
    
    // 4. 바다 애니메이션
    this.oceanZone.updateWaterAnimation(elapsedTime);
    
    // 5. Three.js 씬 업데이트
    this.updateScene(adapted, deltaTime);
    
    // 6. 카메라 업데이트
    this.updateCamera(adapted);
    
    // 7. 렌더링
    this.renderer.render(this.scene, this.camera);
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
      if (adapted.diver.inWater) {
        this.diverModel.visible = true;
        this.diverModel.position.set(
          adapted.diver.position.x,
          adapted.diver.position.y,
          adapted.diver.position.z
        );
        this.diverModel.rotation.y = adapted.diver.heading;
        
        // 수영 애니메이션
        this.diverModel.rotation.x = Math.sin(this.clock.getElapsedTime() * 2) * 0.1;
      } else {
        this.diverModel.visible = false;
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
    const group = new THREE.Group();
    
    // 간단한 물고기 모델 (실제로는 종별 모델 사용)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4169e1,
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
   * 생물 애니메이션
   */
  private animateCreature(model: THREE.Group, behaviorState: string, deltaTime: number): void {
    const time = this.clock.getElapsedTime();
    
    switch (behaviorState) {
      case 'patrol':
        // 일반적인 수영
        model.rotation.y += deltaTime * 0.5;
        break;
      case 'flee':
        // 빠른 도주
        model.rotation.y += deltaTime * 2;
        break;
      case 'chase':
        // 추격
        model.rotation.y += deltaTime * 1.5;
        break;
      case 'idle':
      case 'rest':
        // 정지 (약간의 흔들림)
        model.position.y += Math.sin(time * 2) * 0.01;
        break;
    }
    
    // 꼬리 흔들기 (모든 상태에서)
    const tail = model.children[1];
    if (tail) {
      tail.rotation.y = Math.sin(time * 5) * 0.3;
    }
  }
  
  /**
   * 카메라 업데이트
   */
  private updateCamera(adapted: any): void {
    // 3인칭 카메라 (선박 뒤에서 따라다니기)
    const offset = new THREE.Vector3(0, 30, -50);
    const targetPosition = new THREE.Vector3(
      adapted.ship.position.x + offset.x,
      adapted.ship.position.y + offset.y,
      adapted.ship.position.z + offset.z
    );
    
    // 부드러운 카메라 이동
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
}

/**
 * 사용 예제
 */
export function createOceanGaiaGame(container: HTMLElement): OceanGaiaScene {
  const game = new OceanGaiaScene(container);
  game.start();
  return game;
}

// HTML에서 사용 예제:
/*
<!DOCTYPE html>
<html>
<head>
  <title>OCEAN GAIA V3.2</title>
  <style>
    body { margin: 0; overflow: hidden; }
    #game-container { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module">
    import { createOceanGaiaGame } from './OceanGaiaScene';
    
    const container = document.getElementById('game-container');
    const game = createOceanGaiaGame(container);
    
    // 키보드 입력 처리
    window.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'w':
          game.dispatch({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 0.1 });
          break;
        case 's':
          game.dispatch({ type: 'MOVE_SHIP', forward: -1, turn: 0, dtSec: 0.1 });
          break;
        case 'a':
          game.dispatch({ type: 'MOVE_SHIP', forward: 0, turn: -1, dtSec: 0.1 });
          break;
        case 'd':
          game.dispatch({ type: 'MOVE_SHIP', forward: 0, turn: 1, dtSec: 0.1 });
          break;
        case 'e':
          game.dispatch({ type: 'ENTER_WATER' });
          break;
        case 'q':
          game.dispatch({ type: 'RETURN_TO_SHIP' });
          break;
      }
    });
  </script>
</body>
</html>
*/
