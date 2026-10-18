import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createGame, type GameState } from './core/GameEngine';
import { SPECIES_BY_ID, SPECIES_DATA, type Region } from './data/species';
import { HARPOONS, TANKS, SUITS, SHIP_UPGRADES } from './data/equipment';
import { ISLANDS, COMPANIONS, BOSSES, FOSSILS, WORLD_CONFIG } from './data/world';
import { runAllTests, type TestResult } from './tests/gameEngine.test';
import { inputSystem, type InputAction } from './systems/InputSystem';
import { SaveManager, type SaveSlot } from './systems/SaveManager';

type TabType = 'dashboard' | 'codex' | 'equipment' | 'world' | 'tests' | 'companions' | 'fossils' | 'saves';

function App() {
  const [game] = useState(() => createGame({ seed: 12345 }));
  const [state, setState] = useState<GameState>(game.getSnapshot());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(SaveManager.getSaveSlots());

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    inputSystem.attach();
    const unsub = inputSystem.onAction((action: InputAction) => {
      switch (action) {
        case 'enter_water': handleAction({ type: 'ENTER_WATER' }); break;
        case 'return_to_ship': handleAction({ type: 'RETURN_TO_SHIP' }); break;
        case 'catch':
          if (selectedTarget) handleAction({ type: 'CATCH_ATTEMPT', specimenId: selectedTarget, distanceM: 3 });
          break;
        case 'observe':
          if (selectedTarget) handleAction({ type: 'OBSERVE_CREATURE', specimenId: selectedTarget });
          break;
        case 'sell_all': handleAction({ type: 'SELL_ALL' }); break;
        case 'save': handleSave(0); break;
        case 'load': handleLoad(0); break;
      }
    });
    return () => { inputSystem.detach(); unsub(); };
  }, [selectedTarget]);

  useEffect(() => {
    const unsubscribe = game.subscribe(setState);
    const interval = setInterval(() => {
      const input = inputSystem.getState();
      if (state.inWater) {
        game.dispatch({ type: 'MOVE_DIVER', forward: input.forward, turn: input.turn, vertical: input.vertical, dtSec: 1 / 30 });
      } else {
        game.dispatch({ type: 'MOVE_SHIP', forward: input.forward, turn: input.turn, dtSec: 1 / 30 });
      }
      game.dispatch({ type: 'TICK', dtSec: 1 / 30 });
    }, 1000 / 30);
    return () => { unsubscribe(); clearInterval(interval); };
  }, [game, state.inWater]);

  const handleAction = useCallback((action: { type: string; [key: string]: unknown }) => {
    const result = game.dispatch(action);
    if (result.success) addLog(`✓ ${getActionLabel(action.type)}`);
    else addLog(`✗ ${result.reason}`);
  }, [game, addLog]);

  const handleTest = useCallback(() => {
    const results = runAllTests();
    setTestResults(results);
    addLog(`테스트: ${results.filter(r => r.passed).length}/${results.length} 통과`);
  }, [addLog]);

  const handleSave = useCallback((slotId: number) => {
    SaveManager.save(slotId, game.getSnapshot(), 0, 0);
    setSaveSlots(SaveManager.getSaveSlots());
    addLog('저장 완료');
  }, [game, addLog]);

  const handleLoad = useCallback((slotId: number) => {
    SaveManager.load(slotId);
    setSaveSlots(SaveManager.getSaveSlots());
    addLog('불러오기 완료');
  }, [addLog]);

  const currentRegion = getRegionAt(state.shipX, state.shipZ);
  const nearbyCreatures = useMemo(() => {
    if (!state.inWater) return [];
    return state.activeSpecimens
      .filter(s => distance2D(s.x, s.z, state.diverX, state.diverZ) < 50)
      .sort((a, b) => distance2D(a.x, a.z, state.diverX, state.diverZ) - distance2D(b.x, b.z, state.diverX, state.diverZ));
  }, [state.activeSpecimens, state.diverX, state.diverZ, state.inWater]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2840] to-[#0a1628] text-white">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-[1920px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-3xl font-light tracking-wide bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  OCEAN GAIA
                </h1>
                <p className="text-xs text-cyan-400/60 tracking-widest mt-1">V3.2 — GAME SYSTEMS ENGINE</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleSave(0)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg text-sm font-light tracking-wide transition-all duration-300">
                저장
              </button>
              <button onClick={() => handleLoad(0)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg text-sm font-light tracking-wide transition-all duration-300">
                불러오기
              </button>
              <button onClick={handleTest} className="px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 rounded-lg text-sm font-light tracking-wide text-cyan-300 transition-all duration-300">
                테스트
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-8 py-8">
        {/* Status Bar */}
        <div className="grid grid-cols-8 gap-4 mb-8">
          <StatusBar icon="🐚" label="조개" value={state.shells.toLocaleString()} />
          <StatusBar icon="📍" label="좌표" value={`${Math.round(state.shipX)}, ${Math.round(state.shipZ)}`} />
          <StatusBar icon="🗺️" label="해역" value={getRegionName(currentRegion)} />
          <StatusBar icon="📅" label="날짜" value={`Day ${state.day}`} />
          <StatusBar icon="🕐" label="시간" value={`${Math.floor(state.hour)}:00`} />
          <StatusBar icon={getWeatherEmoji(state.weather)} label="날씨" value={getWeatherName(state.weather)} />
          <StatusBar icon="🚢" label="선박" value={`Lv.${state.shipLevel}`} />
          <StatusBar icon="🏆" label="호칭" value={state.title} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 backdrop-blur-xl bg-white/5 rounded-2xl p-2 border border-white/10">
          {(['dashboard', 'codex', 'equipment', 'world', 'companions', 'fossils', 'saves', 'tests'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 rounded-xl text-sm font-light tracking-wide transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            {activeTab === 'dashboard' && (
              <DashboardPanel state={state} nearbyCreatures={nearbyCreatures} selectedTarget={selectedTarget} onSelectTarget={setSelectedTarget} onAction={handleAction} />
            )}
            {activeTab === 'codex' && <CodexPanel state={state} />}
            {activeTab === 'equipment' && <EquipmentPanel state={state} onAction={handleAction} />}
            {activeTab === 'world' && <WorldPanel state={state} />}
            {activeTab === 'companions' && <CompanionsPanel state={state} onAction={handleAction} />}
            {activeTab === 'fossils' && <FossilsPanel state={state} onAction={handleAction} />}
            {activeTab === 'saves' && <SavesPanel slots={saveSlots} onSave={handleSave} onLoad={handleLoad} />}
            {activeTab === 'tests' && <TestsPanel results={testResults} onRun={handleTest} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PlayerStatusPanel state={state} />
            <QuickActionsPanel state={state} onAction={handleAction} />
            <MiniMap state={state} />
            <LogPanel logs={logs} />
            <EngineInfoPanel state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Functions ───

function getRegionAt(x: number, z: number): Region {
  for (const [region, bounds] of Object.entries(WORLD_CONFIG.regions)) {
    if (x >= bounds.xMin && x < bounds.xMax && z >= bounds.zMin && z < bounds.zMax) return region as Region;
  }
  return 'ocean';
}

function getRegionName(region: Region): string {
  const names: Record<Region, string> = {
    tropical: '열대', glacier: '빙하', volcanic: '화산',
    mangrove: '맹그로브', ocean: '대양', deepsea: '심해'
  };
  return names[region];
}

function getWeatherEmoji(w: string): string {
  return ({ clear: '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️', fog: '🌫️', snow: '🌨️' } as Record<string, string>)[w] || '☀️';
}

function getWeatherName(w: string): string {
  return ({ clear: '맑음', cloudy: '흐림', rain: '비', storm: '폭풍', fog: '안개', snow: '눈' } as Record<string, string>)[w] || w;
}

function getTabLabel(tab: TabType): string {
  return ({ dashboard: '대시보드', codex: '도감', equipment: '장비', world: '월드', companions: '동료', fossils: '화석', saves: '저장', tests: '테스트' } as Record<TabType, string>)[tab];
}

function getActionLabel(type: string): string {
  const labels: Record<string, string> = {
    MOVE_SHIP: '선박 이동', ENTER_WATER: '입수', RETURN_TO_SHIP: '귀선',
    MOVE_DIVER: '잠수 이동', CATCH_ATTEMPT: '포획', OBSERVE_CREATURE: '관찰',
    SELL_ALL: '판매', BUY_ITEM: '구매', EQUIP_ITEM: '장착',
    UPGRADE_SHIP: '개조', COLLECT_FOSSIL: '화석', SUMMON_BOSS: '보스 소환',
    ATTACK_BOSS: '공격', RECRUIT_COMPANION: '영입',
  };
  return labels[type] || type;
}

function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
}

// ─── Components ───

function StatusBar({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl px-5 py-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-white/40 tracking-wide">{label}</p>
          <p className="text-sm font-light text-white/90">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PlayerStatusPanel({ state }: { state: GameState }) {
  const shipData = SHIP_UPGRADES[state.shipLevel - 1];
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-light tracking-wide text-cyan-300 mb-4">플레이어 상태</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-white/40">선박</span>
          <span className="text-white/90">Lv.{state.shipLevel} {shipData?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">화물</span>
          <span className="text-white/90">{state.cargo.length}/{shipData?.cargoCapacity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">상태</span>
          <span className="text-white/90">{state.inWater ? '수중' : '선박'}</span>
        </div>
        {state.inWater && (
          <>
            <div>
              <div className="flex justify-between text-xs text-white/40 mb-2">
                <span>산소</span><span>{Math.round(state.airRemaining)}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${state.airRemaining > 30 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                  style={{ width: `${state.airRemaining}%` }} />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">수심</span>
              <span className="text-white/90">{Math.abs(Math.round(state.diverY))}m</span>
            </div>
          </>
        )}
        <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-white/40">총 잠수</span>
            <span className="text-white/90">{state.totalDives}회</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">총 포획</span>
            <span className="text-white/90">{state.totalCatches}마리</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">발견</span>
            <span className="text-white/90">{state.uniqueSpeciesCaught}/200종</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionsPanel({ state, onAction }: { state: GameState; onAction: (a: any) => void }) {
  const cargoValue = useMemo(() => {
    let total = 0;
    for (const spec of state.cargo) {
      const species = SPECIES_BY_ID.get(spec.speciesId);
      if (species && !species.protected) total += Math.round(species.sellBasePrice * Math.pow(spec.lengthCm / species.gameBaseLengthCm, 1.5));
    }
    return total;
  }, [state.cargo]);

  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-light tracking-wide text-cyan-300 mb-4">빠른 조작</h3>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onAction({ type: 'ENTER_WATER' })} className="px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-light transition-all duration-300">
          입수
        </button>
        <button onClick={() => onAction({ type: 'RETURN_TO_SHIP' })} className="px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-light transition-all duration-300">
          귀선
        </button>
        <button onClick={() => onAction({ type: 'SELL_ALL' })} className="px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-light transition-all duration-300">
          판매
        </button>
        <button onClick={() => onAction({ type: 'UPGRADE_SHIP' })} className="px-4 py-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-sm font-light transition-all duration-300">
          개조
        </button>
      </div>
      {cargoValue > 0 && (
        <p className="text-xs text-cyan-300/60 mt-4 text-center">예상 판매가: 🐚{cargoValue.toLocaleString()}</p>
      )}
    </div>
  );
}

function MiniMap({ state }: { state: GameState }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-light tracking-wide text-cyan-300 mb-4">미니맵</h3>
      <div className="relative w-full aspect-[3/2] bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-white/10 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 opacity-30">
          <div className="bg-green-500/20 border-r border-b border-white/5" />
          <div className="bg-emerald-500/20 border-r border-b border-white/5" />
          <div className="bg-blue-500/20 border-b border-white/5" />
          <div className="bg-blue-400/20 border-r border-white/5" />
          <div className="bg-orange-500/20 border-r border-white/5" />
          <div className="bg-purple-500/20" />
        </div>
        {ISLANDS.map(island => (
          <div key={island.id} className="absolute w-1.5 h-1.5 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(island.x / 4800) * 100}%`, top: `${(island.y / 3200) * 100}%` }} />
        ))}
        {state.activeSpecimens.slice(0, 30).map(spec => (
          <div key={spec.uid} className="absolute w-1 h-1 bg-cyan-400/50 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(spec.x / 4800) * 100}%`, top: `${(spec.z / 3200) * 100}%` }} />
        ))}
        <div className="absolute w-3 h-3 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-yellow-400/50"
          style={{ left: `${(state.shipX / 4800) * 100}%`, top: `${(state.shipZ / 3200) * 100}%` }} />
        {state.inWater && (
          <div className="absolute w-2.5 h-2.5 bg-gradient-to-br from-green-300 to-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-green-400/50"
            style={{ left: `${(state.diverX / 4800) * 100}%`, top: `${(state.diverZ / 3200) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

function LogPanel({ logs }: { logs: string[] }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-light tracking-wide text-cyan-300 mb-4">로그</h3>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {logs.length === 0 ? (
          <p className="text-xs text-white/40">조작 기록이 표시됩니다</p>
        ) : (
          logs.slice(0, 20).map((log, i) => (
            <p key={i} className="text-xs text-white/60 font-mono">{log}</p>
          ))
        )}
      </div>
    </div>
  );
}

function EngineInfoPanel({ state }: { state: GameState }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-light tracking-wide text-cyan-300 mb-4">엔진 정보</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="text-white/40">버전</div><div className="text-white/90 text-right">{state.version}</div>
        <div className="text-white/40">시드</div><div className="text-white/90 text-right">{state.seed}</div>
        <div className="text-white/40">틱</div><div className="text-white/90 text-right">{state.tick}</div>
        <div className="text-white/40">게임시간</div><div className="text-white/90 text-right">{Math.floor(state.gameTimeSec)}s</div>
        <div className="text-white/40">활성개체</div><div className="text-white/90 text-right">{state.activeSpecimens.length}</div>
        <div className="text-white/40">도감</div><div className="text-white/90 text-right">{Object.keys(state.codex).length}/200</div>
      </div>
    </div>
  );
}

function DashboardPanel({ state, nearbyCreatures, selectedTarget, onSelectTarget, onAction }: {
  state: GameState; nearbyCreatures: typeof state.activeSpecimens; selectedTarget: string | null;
  onSelectTarget: (uid: string) => void; onAction: (a: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light tracking-wide text-cyan-300">
            {state.inWater ? '수중 모드' : '항해 모드'}
          </h2>
          <button onClick={() => onAction({ type: state.inWater ? 'RETURN_TO_SHIP' : 'ENTER_WATER' })}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 backdrop-blur-sm border border-cyan-400/30 rounded-xl text-sm font-light tracking-wide text-cyan-300 transition-all duration-300">
            {state.inWater ? '귀선' : '입수'}
          </button>
        </div>

        {!state.inWater && (
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32 bg-gradient-to-br from-white/5 to-white/10 rounded-full border border-white/10 flex items-center justify-center">
              <div className="absolute w-1 h-10 bg-gradient-to-t from-cyan-400 to-transparent rounded-full origin-bottom"
                style={{ transform: `rotate(${state.shipHeading * 180 / Math.PI}deg)` }} />
              <div className="w-4 h-4 bg-gradient-to-br from-cyan-300 to-blue-500 rounded-full shadow-lg shadow-cyan-400/50" />
            </div>
            <div className="text-sm space-y-2 text-white/60">
              <p>방위: {Math.round(state.shipHeading * 180 / Math.PI)}°</p>
              <p>속도: {SHIP_UPGRADES[state.shipLevel - 1]?.speed} m/s</p>
              <p>해역: {getRegionName(getRegionAt(state.shipX, state.shipZ))}</p>
            </div>
          </div>
        )}
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-light tracking-wide text-cyan-300 mb-6">
          주변 생물 <span className="text-white/40 text-base">({nearbyCreatures.length})</span>
        </h2>
        {nearbyCreatures.length === 0 ? (
          <p className="text-white/40 text-sm">
            {state.inWater ? '주변에 생물이 없습니다' : '입수하면 생물을 볼 수 있습니다'}
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {nearbyCreatures.map(spec => {
              const species = SPECIES_BY_ID.get(spec.speciesId);
              const dist = distance2D(spec.x, spec.z, state.diverX, state.diverZ);
              const isSelected = spec.uid === selectedTarget;
              return (
                <div key={spec.uid} onClick={() => onSelectTarget(spec.uid)}
                  className={`flex items-center justify-between rounded-xl px-5 py-4 text-sm cursor-pointer transition-all duration-300 ${
                    isSelected ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}>
                  <div className="flex items-center gap-3">
                    {species?.protected && <span className="text-yellow-400">🛡️</span>}
                    <span className="font-light text-white/90">{species?.name}</span>
                    <span className="text-xs text-white/40">{spec.behaviorState}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white/60">{spec.lengthCm.toFixed(1)}cm / {spec.weightKg.toFixed(2)}kg</span>
                    <span className="text-white/40 text-xs">{dist.toFixed(1)}m</span>
                    <button onClick={(e) => { e.stopPropagation(); onAction({ type: 'OBSERVE_CREATURE', specimenId: spec.uid }); }}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs transition-all duration-300">관찰</button>
                    <button onClick={(e) => { e.stopPropagation(); onAction({ type: 'CATCH_ATTEMPT', specimenId: spec.uid, distanceM: dist }); }}
                      disabled={species?.protected}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-xs text-cyan-300 disabled:opacity-30 transition-all duration-300">포획</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light tracking-wide text-cyan-300">
            화물 <span className="text-white/40 text-base">({state.cargo.length}/{SHIP_UPGRADES[state.shipLevel - 1]?.cargoCapacity})</span>
          </h2>
          {state.cargo.length > 0 && (
            <button onClick={() => onAction({ type: 'SELL_ALL' })}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 backdrop-blur-sm border border-yellow-400/30 rounded-xl text-sm font-light tracking-wide text-yellow-300 transition-all duration-300">
              전체 판매
            </button>
          )}
        </div>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {state.cargo.length === 0 ? (
            <p className="text-white/40 text-sm">화물이 비어있습니다</p>
          ) : (
            state.cargo.map(spec => {
              const species = SPECIES_BY_ID.get(spec.speciesId);
              return (
                <div key={spec.uid} className="flex justify-between bg-white/5 rounded-xl px-5 py-3 text-sm">
                  <span className="text-white/90 font-light">{species?.name}</span>
                  <span className="text-white/60">{spec.lengthCm.toFixed(1)}cm / {spec.weightKg.toFixed(2)}kg</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function CodexPanel({ state }: { state: GameState }) {
  const entries = Object.values(state.codex);
  const caught = entries.filter(e => e.catchCount > 0).length;

  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
      <h2 className="text-3xl font-light tracking-wide text-cyan-300 mb-8">도감</h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 text-center border border-white/10">
          <p className="text-4xl font-light text-cyan-300 mb-2">{entries.length}</p>
          <p className="text-sm text-white/40">발견</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 text-center border border-white/10">
          <p className="text-4xl font-light text-emerald-300 mb-2">{caught}</p>
          <p className="text-sm text-white/40">포획</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 text-center border border-white/10">
          <p className="text-4xl font-light text-yellow-300 mb-2">{entries.filter(e => e.observeCount > 0).length}</p>
          <p className="text-sm text-white/40">관찰</p>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto space-y-2">
        {entries.length === 0 ? (
          <p className="text-white/40 text-center py-16">아직 발견한 생물이 없습니다</p>
        ) : (
          entries.sort((a, b) => a.speciesId - b.speciesId).map(entry => {
            const species = SPECIES_BY_ID.get(entry.speciesId);
            if (!species) return null;
            return (
              <div key={entry.speciesId} className="bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-lg font-light text-white/90">{species.name}</span>
                    <span className="text-xs text-white/40 ml-3 italic">{species.scientificName}</span>
                    {species.protected && <span className="ml-2 text-yellow-400">🛡️</span>}
                  </div>
                  <span className="text-xs text-white/40">#{species.id}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs text-white/60">
                  <span>포획: {entry.catchCount}</span>
                  <span>관찰: {entry.observeCount}</span>
                  <span>최장: {entry.maxLengthCm.toFixed(1)}cm</span>
                  <span>최중: {entry.maxWeightKg.toFixed(2)}kg</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EquipmentPanel({ state, onAction }: { state: GameState; onAction: (a: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
        <h2 className="text-2xl font-light tracking-wide text-cyan-300 mb-6">작살 ({state.ownedHarpoons.length}/24)</h2>
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {HARPOONS.map(h => {
            const owned = state.ownedHarpoons.includes(h.id);
            const equipped = state.equippedHarpoon === h.id;
            return (
              <div key={h.id} className={`rounded-xl p-4 border transition-all duration-300 ${
                equipped ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/30' :
                owned ? 'bg-white/5 border-white/10' : 'bg-white/5 border-white/10 opacity-60'
              }`}>
                <div className="flex justify-between mb-2">
                  <span className="font-light text-white/90">{h.name}</span>
                  <span className="text-xs text-white/40">{h.price > 0 ? `🐚${h.price}` : '기본'}</span>
                </div>
                <div className="text-xs text-white/60 mb-2">
                  사거리:{h.range}m | 속도:{h.speed} | 안정:{h.stability}
                </div>
                <div>
                  {equipped ? <span className="text-xs text-cyan-300">장착중</span> :
                    owned ? <button onClick={() => onAction({ type: 'EQUIP_ITEM', itemType: 'harpoon', itemId: h.id })}
                      className="text-xs text-cyan-300 hover:text-cyan-200">장착</button> :
                    <button onClick={() => onAction({ type: 'BUY_ITEM', itemType: 'harpoon', itemId: h.id })}
                      className="text-xs text-yellow-300 hover:text-yellow-200">구매</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorldPanel({ state }: { state: GameState }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
      <h2 className="text-3xl font-light tracking-wide text-cyan-300 mb-8">월드 (4800×3200m)</h2>
      <div className="relative w-full aspect-[3/2] bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl border border-white/10 mb-8 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 opacity-30">
          <div className="bg-green-500/20 border-r border-b border-white/5 flex items-center justify-center text-xs text-green-300">열대</div>
          <div className="bg-emerald-500/20 border-r border-b border-white/5 flex items-center justify-center text-xs text-emerald-300">맹그로브</div>
          <div className="bg-blue-500/20 border-b border-white/5 flex items-center justify-center text-xs text-blue-300">빙하</div>
          <div className="bg-blue-400/20 border-r border-white/5 flex items-center justify-center text-xs text-blue-300">대양</div>
          <div className="bg-orange-500/20 border-r border-white/5 flex items-center justify-center text-xs text-orange-300">화산</div>
          <div className="bg-purple-500/20 flex items-center justify-center text-xs text-purple-300">심해</div>
        </div>
        {ISLANDS.map(island => (
          <div key={island.id} className="absolute w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(island.x / 4800) * 100}%`, top: `${(island.y / 3200) * 100}%` }} title={island.name} />
        ))}
        <div className="absolute w-4 h-4 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-yellow-400/50"
          style={{ left: `${(state.shipX / 4800) * 100}%`, top: `${(state.shipZ / 3200) * 100}%` }} />
      </div>
      <h3 className="text-xl font-light tracking-wide text-cyan-300 mb-4">섬 목록 ({ISLANDS.length}개)</h3>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {ISLANDS.map(island => (
          <div key={island.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
            <div className="flex justify-between mb-2">
              <span className="font-light text-white/90">{island.name}</span>
              <span className="text-xs text-white/40">{getRegionName(island.region)}</span>
            </div>
            <p className="text-xs text-white/60 mb-2">{island.description}</p>
            <div className="text-xs text-white/40">
              {island.hasPort && '🏪 '} {island.hasShop && '🛒 '} {island.hasDock && '⚓ '}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanionsPanel({ state, onAction }: { state: GameState; onAction: (a: any) => void }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
      <h2 className="text-3xl font-light tracking-wide text-cyan-300 mb-8">동료 ({state.companions.length}/3)</h2>
      <div className="space-y-4">
        {COMPANIONS.map(c => {
          const recruited = state.companions.includes(c.id);
          return (
            <div key={c.id} className={`rounded-2xl p-6 border transition-all duration-300 ${
              recruited ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-400/30' : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-2xl font-light text-white/90">{c.name}</span>
                  <span className="text-white/40 ml-3">{c.role}</span>
                </div>
                {recruited ? (
                  <span className="px-4 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm">합류</span>
                ) : (
                  <button onClick={() => onAction({ type: 'RECRUIT_COMPANION', companionId: c.id })}
                    className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all duration-300">영입</button>
                )}
              </div>
              <p className="text-sm text-white/60 mb-3">{c.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-emerald-300">
                  보너스: +{(c.bonus.value * 100).toFixed(0)}%
                </span>
                <span className="text-yellow-300">해금: {c.unlockCondition}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FossilsPanel({ state, onAction }: { state: GameState; onAction: (a: any) => void }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
      <h2 className="text-3xl font-light tracking-wide text-cyan-300 mb-8">화석 & 보스 ({state.fossils.length}/15)</h2>
      {BOSSES.map(boss => {
        const bossFossils = FOSSILS.filter(f => f.bossId === boss.id);
        const collected = bossFossils.filter(f => state.fossils.includes(f.id));
        return (
          <div key={boss.id} className="mb-6 bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-2xl font-light text-white/90">{boss.name}</span>
                <span className="text-xs text-white/40 ml-3 italic">{boss.scientificName}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-white/60">HP: {boss.hp.toLocaleString()}</span>
                <span className="text-xs text-yellow-300 ml-3">🐚{boss.rewardShells.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3 mb-4">
              {bossFossils.map(f => (
                <div key={f.id} className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  state.fossils.includes(f.id) ? 'bg-yellow-500/20 border-yellow-400/30' : 'bg-white/5 border-white/10'
                }`}>
                  {state.fossils.includes(f.id) ? '🦴' : '?'}
                </div>
              ))}
            </div>
            <button onClick={() => onAction({ type: 'SUMMON_BOSS', bossId: boss.id })}
              disabled={collected.length < boss.fossilRequired || state.bossActive !== null}
              className="px-6 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-400/30 rounded-xl text-sm text-red-300 disabled:opacity-30 transition-all duration-300">
              소환
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SavesPanel({ slots, onSave, onLoad }: { slots: SaveSlot[]; onSave: (id: number) => void; onLoad: (id: number) => void }) {
  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
      <h2 className="text-3xl font-light tracking-wide text-cyan-300 mb-8">저장 관리</h2>
      <div className="space-y-4">
        {slots.map(slot => (
          <div key={slot.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xl font-light text-white/90">{slot.name}</span>
                {slot.timestamp > 0 && (
                  <span className="text-xs text-white/40 ml-3">{SaveManager.formatDate(slot.timestamp)}</span>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => onSave(slot.id)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all duration-300">저장</button>
                <button onClick={() => onLoad(slot.id)}
                  disabled={slot.timestamp === 0}
                  className="px-5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 rounded-lg text-sm text-cyan-300 disabled:opacity-30 transition-all duration-300">불러오기</button>
              </div>
            </div>
            {slot.timestamp > 0 && (
              <div className="grid grid-cols-4 gap-6 text-xs text-white/60">
                <div>플레이: {SaveManager.formatPlayTime(slot.playTimeSec)}</div>
                <div>조개: 🐚{slot.shells.toLocaleString()}</div>
                <div>발견: {slot.speciesDiscovered}종</div>
                <div>선박: Lv.{slot.shipLevel}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TestsPanel({ results, onRun }: { results: TestResult[]; onRun: () => void }) {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-light tracking-wide text-cyan-300">테스트</h2>
        <button onClick={onRun} className="px-8 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/30 rounded-xl text-sm font-light tracking-wide text-cyan-300 transition-all duration-300">
          테스트 실행
        </button>
      </div>

      {results.length === 0 ? (
        <p className="text-white/40 text-center py-16">위의 "테스트 실행" 버튼을 클릭하세요</p>
      ) : (
        <>
          <div className="mb-8 flex items-center gap-6">
            <div className={`text-5xl font-light ${passed === total ? 'text-emerald-300' : 'text-red-300'}`}>
              {passed}/{total}
            </div>
            <div className="flex-1">
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${passed === total ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                  style={{ width: `${(passed / total) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className={`rounded-xl p-5 border ${
                r.passed ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-red-500/10 border-red-400/30'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.passed ? '✅' : '❌'}</span>
                  <span className="font-light text-white/90">{r.name}</span>
                </div>
                <p className="text-xs text-white/60 mt-2 ml-11">{r.message}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
