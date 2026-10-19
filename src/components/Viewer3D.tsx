// OCEAN GAIA V3.2 — 3D Viewer Component
// 세션 B 소유 — Three.js 3D 뷰어

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createStartingIsland } from '../models/StartingIsland';
import { createPlayerHouse } from '../models/PlayerHouse';
import { createDiverCharacter } from '../models/DiverCharacter';

export function Viewer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const diverRef = useRef<any>(null);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    if (!containerRef.current) return;

    // 씬 초기화
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 하늘색
    scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
    sceneRef.current = scene;

    // 카메라 설정
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(30, 20, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 렌더러 설정
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 조명 설정
    // 환경광
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 태양광 (방향광)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);

    // hemisphere light (하늘과 땅의 색)
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b6f47, 0.3);
    scene.add(hemiLight);

    // 시작섬 추가
    const island = createStartingIsland();
    const islandModel = island.getModel();
    scene.add(islandModel);

    // 플레이어 집 추가
    const house = createPlayerHouse(1);
    const houseModel = house.getModel();
    scene.add(houseModel);

    // 잠수사 캐릭터 추가
    const diver = createDiverCharacter(1, 1, 1);
    const diverModel = diver.getModel();
    diverModel.position.set(5, 1, 5);
    scene.add(diverModel);
    diverRef.current = diver;

    // 바다 평면
    const seaGeometry = new THREE.PlaneGeometry(500, 500);
    const seaMaterial = new THREE.MeshStandardMaterial({
      color: 0x006994,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.8,
    });
    const sea = new THREE.Mesh(seaGeometry, seaMaterial);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -2;
    sea.receiveShadow = true;
    scene.add(sea);

    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate);

      const deltaTime = clockRef.current.getDelta();

      // 잠수사 애니메이션 업데이트
      if (diverRef.current) {
        diverRef.current.update(deltaTime);
      }

      // 카메라 회전 (자동)
      const time = clockRef.current.getElapsedTime();
      camera.position.x = Math.cos(time * 0.1) * 40;
      camera.position.z = Math.sin(time * 0.1) * 40;
      camera.lookAt(0, 5, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 윈도우 리사이즈 처리
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    />
  );
}
