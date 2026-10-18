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
  const [showControls, setShowControls] = useState(false);
  const tickCountRef = useRef(0);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 100));
  }, []);

  // Input system
  useEffect(() => {
    inputSystem.attach();
    const unsub = inputSystem.onAction((action: InputAction) => {
      switch (action) {
        case 'enter_water': handleAction({ type: 'ENTER_WATER' }); break;
        case 'return_to_ship': handleAction({ type: 'RETURN_TO_SHIP' }); break;
        case 'catch':
          if (selectedTarget) {
            handleAction({ type: 'CATCH_ATTEMPT', specimenId: selectedTarget, distanceM: 3 });
          }
          break;
        case 'observe':
          if (selectedTarget) {
            handleAction({ type: 'OBSERVE_CREATURE', specimenId: selectedTarget });
          }
          break;
        case 'sell_all': handleAction({ type: 'SELL_ALL' }); break;
        case 'save': handleSave(0); break;
        case 'load': handleLoad(0); break;
        case 'switch_target': cycleTarget(); break;
      }
    });

    return () => {
      inputSystem.detach();
      unsub();
    };
  }, [selectedTarget]);

  // Game loop
  useEffect(() => {
    const unsubscribe = game.subscribe((newState) => {
      setState(newState);
    });

    const interval = setInterval(() => {
      const input = inputSystem.getState();
      if (state.inWater) {
        game.dispatch({ type: 'MOVE_DIVER', forward: input.forward, turn: input.turn, vertical: input.vertical, dtSec: 1 / 30 });
      } else {
        game.dispatch({ type: 'MOVE_SHIP', forward: input.forward, turn: input.turn, dtSec: 1 / 30 });
      }
      game.dispatch({ type: 'TICK', dtSec: 1 / 30 });
      tickCountRef.current++;
    }, 1000 / 30);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [game, state.inWater]);

  const handleAction = useCallback((action: { type: string; [key: string]: unknown }) => {
    const result = game.dispatch(action);
    if (result.success) {
      addLog(`✓ ${getActionLabel(action.type)} 성공`);
    } else {
      addLog(`✗ ${getActionLabel(action.type)}: ${result.reason}`);
    }
  }, [game, addLog]);

  const handleTest = useCallback(() => {
    const results = runAllTests();
    setTestResults(results);
    addLog(`🧪 테스트: ${results.filter(r => r.passed).length}/${results.length} 통과`);
  }, [addLog]);

  const handleSave = useCallback((slotId: number) => {
    const result = SaveManager.save(slotId, game.getSnapshot(), 0, 0);
    setSaveSlots(SaveManager.getSaveSlots());
    addLog(result.success ? `💾 슬롯 ${slotId + 1}에 저장` : `저장 실패: ${result.error}`);
  }, [game, addLog]);

  const handleLoad = useCallback((slotId: number) => {
    const result = SaveManager.load(slotId);
    if (result.success && result.data) {
      addLog(`📂 슬롯 ${slotId + 1} 불러오기 완료`);
    } else {
      addLog(`불러오기 실패: ${result.error}`);
    }
    setSaveSlots(SaveManager.getSaveSlots());
  }, [addLog]);

  const cycleTarget = useCallback(() => {
    if (state.activeSpecimens.length === 0) return;
    const currentIdx = state.activeSpecimens.findIndex(s => s.uid === selectedTarget);
    const nextIdx = (currentIdx + 1) % state.activeSpecimens.length;
    setSelectedTarget(state.activeSpecimens[nextIdx].uid);
  }, [state.activeSpecimens, selectedTarget]);

  const currentRegion = getRegionAt(state.shipX, state.shipZ);
  const nearbyCreatures = useMemo(() => {
    if (!state.inWater) return [];
    return state.activeSpecimens
      .filter(s => distance2D(s.x, s.z, state.diverX, state.diverZ) < 50)
      .sort((a, b) => {
        const da = distance2D(a.x, a.z, state.diverX, state.diverZ);
        const db = distance2D(b.x, b.z, state.diverX, state.diverZ);
        return da - db;
      });
  }, [state.activeSpecimens, state.diverX, state.diverZ, state.inWater]);

  const cargoValue = useMemo(() => {
    let total = 0;
    for (const spec of state.cargo) {
      const species = SPECIES_BY_ID.get(spec.speciesId);
      if (species && !species.protected) {
        total += Math.round(species.sellBasePrice * Math.pow(spec.lengthCm / species.gameBaseLengthCm, 1.5));
      }
    }
    return total;
  }, [state.cargo]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur border-b border-blue-500/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              🌊 OCEAN GAIA V3.2
            </h1>
            <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded-full border border-emerald-700/50">
              Session B — Game Engine
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowControls(!showControls)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs transition">
              ⌨️ 조작법
            </button>
            <button onClick={() => handleSave(0)} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-xs font-medium transition">
              💾 저장
            </button>
            <button onClick={() => handleLoad(0)} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs font-medium transition">
              📂 불러오기
            </button>
            <button onClick={handleTest} className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 rounded text-xs font-medium transition">
              🧪 테스트
            </button>
          </div>
        </div>
      </header>

      {/* Controls Help Modal */}
      {showControls && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowControls(false)}>
          <div className="bg-slate-800 rounded-xl p-6 max-w-md border border-slate-600" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-cyan-400 mb-4">⌨️ 조작법</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-slate-400">이동</div><div>W/A/S/D 또는 방향키</div>
                <div className="text-slate-400">입수</div><div>E</div>
                <div className="text-slate-400">귀선</div><div>Q</div>
                <div className="text-slate-400">포획</div><div>Space</div>
                <div className="text-slate-400">관찰</div><div>F</div>
                <div className="text-slate-400">전체 판매</div><div>Enter</div>
                <div className="text-slate-400">대상 전환</div><div>Tab</div>
                <div className="text-slate-400">저장</div><div>Ctrl+S</div>
                <div className="text-slate-400">불러오기</div><div>Ctrl+L</div>
                <div className="text-slate-400">상하 이동(수중)</div><div>R/F</div>
              </div>
            </div>
            <button onClick={() => setShowControls(false)} className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1920px] mx-auto p-4">
        {/* Status Bar */}
        <div className="grid grid-cols-3 md:grid-cols-8 gap-2 mb-4">
          <MiniStat icon="🐚" label="조개" value={state.shells.toLocaleString()} />
          <MiniStat icon="📍" label="좌표" value={`${Math.round(state.shipX)}, ${Math.round(state.shipZ)}`} />
          <MiniStat icon="🗺️" label="해역" value={getRegionName(currentRegion)} />
          <MiniStat icon="📅" label="날짜" value={`Day ${state.day}`} />
          <MiniStat icon="🕐" label="시간" value={`${Math.floor(state.hour)}:00`} />
          <MiniStat icon={getWeatherEmoji(state.weather)} label="날씨" value={getWeatherName(state.weather)} />
          <MiniStat icon="🚢" label="선박" value={`Lv.${state.shipLevel}`} />
          <MiniStat icon="🏆" label="호칭" value={state.title} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 bg-slate-800/40 rounded-lg p-1">
          {(['dashboard', 'codex', 'equipment', 'world', 'companions', 'fossils', 'saves', 'tests'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {getTabIcon(tab)} {getTabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main Panel */}
          <div className="xl:col-span-3">
            {activeTab === 'dashboard' && (
              <DashboardPanel
                state={state}
                nearbyCreatures={nearbyCreatures}
                selectedTarget={selectedTarget}
                onSelectTarget={setSelectedTarget}
                onAction={handleAction}
              />
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
          <div className="space-y-3">
            {/* Player Status */}
            <PlayerStatusPanel state={state} />

            {/* Quick Actions */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
              <h3 className="font-bold text-cyan-400 text-sm mb-2">⚡ 빠른 조작</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <ActionBtn onClick={() => handleAction({ type: 'ENTER_WATER' })} label="🏊 입수" hotkey="E" />
                <ActionBtn onClick={() => handleAction({ type: 'RETURN_TO_SHIP' })} label="🚢 귀선" hotkey="Q" />
                <ActionBtn onClick={() => handleAction({ type: 'SELL_ALL' })} label="💰 판매" hotkey="↵" />
                <ActionBtn onClick={() => handleAction({ type: 'UPGRADE_SHIP' })} label="⬆️ 개조" />
              </div>
              {cargoValue > 0 && (
                <p className="text-xs text-yellow-400 mt-2">💰 예상 판매가: 🐚{cargoValue.toLocaleString()}</p>
              )}
            </div>

            {/* Mini Map */}
            <MiniMap state={state} />

            {/* Log */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
              <h3 className="font-bold text-cyan-400 text-sm mb-2">📋 로그</h3>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-xs">조작 기록이 표시됩니다</p>
                ) : (
                  logs.slice(0, 20).map((log, i) => (
                    <p key={i} className="text-[10px] text-slate-400 font-mono truncate">{log}</p>
                  ))
                )}
              </div>
            </div>

            {/* Engine Stats */}
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
              <h3 className="font-bold text-cyan-400 text-sm mb-2">⚙️ 엔진</h3>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                <span>버전</span><span className="text-right">{state.version}</span>
                <span>시드</span><span className="text-right">{state.seed}</span>
                <span>틱</span><span className="text-right">{state.tick}</span>
                <span>게임시간</span><span className="text-right">{Math.floor(state.gameTimeSec)}s</span>
                <span>활성개체</span><span className="text-right">{state.activeSpecimens.length}</span>
                <span>도감</span><span className="text-right">{Object.keys(state.codex).length}/200</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Functions ───

function getRegionAt(x: number, z: number): Region {
  for (const [region, bounds] of Object.entries(WORLD_CONFIG.regions)) {
    if (x >= bounds.xMin && x < bounds.xMax && z >= bounds.zMin && z < bounds.zMax) {
      return region as Region;
    }
  }
  return 'ocean';
}

function getRegionName(region: Region): string {
  const names: Record<Region, string> = {
    tropical: '🌴 열대', glacier: '🧊 빙하', volcanic: '🌋 화산',
    mangrove: '🌿 맹그로브', ocean: '🌊 대양', deepsea: '🌑 심해'
  };
  return names[region];
}

function getWeatherEmoji(w: string): string {
  return ({ clear: '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️', fog: '🌫️', snow: '🌨️' } as Record<string, string>)[w] || '☀️';
}

function getWeatherName(w: string): string {
  return ({ clear: '맑음', cloudy: '흐림', rain: '비', storm: '폭풍', fog: '안개', snow: '눈' } as Record<string, string>)[w] || w;
}

function getTabIcon(tab: TabType): string {
  return ({ dashboard: '🎯', codex: '📖', equipment: '🔧', world: '🗺️', companions: '👥', fossils: '🦴', saves: '💾', tests: '🧪' } as Record<TabType, string>)[tab];
}

function getTabLabel(tab: TabType): string {
  return ({ dashboard: '대시보드', codex: '도감', equipment: '장비', world: '월드', companions: '동료', fossils: '화석', saves: '저장', tests: '테스트' } as Record<TabType, string>)[tab];
}

function getActionLabel(type: string): string {
  const labels: Record<string, string> = {
    MOVE_SHIP: '선박 이동', ENTER_WATER: '입수', RETURN_TO_SHIP: '귀선',
    MOVE_DIVER: '잠수 이동', CATCH_ATTEMPT: '포획 시도', OBSERVE_CREATURE: '관찰',
    SELL_ALL: '전체 판매', BUY_ITEM: '구매', EQUIP_ITEM: '장착',
    UPGRADE_SHIP: '선박 개조', COLLECT_FOSSIL: '화석 수집', SUMMON_BOSS: '보스 소환',
    ATTACK_BOSS: '보스 공격', RECRUIT_COMPANION: '동료 영입',
  };
  return labels[type] || type;
}

function distance2D(x1: number, z1: number, x2: number, z2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
}

// ─── Components ───

function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-700/50">
      <p className="text-[10px] text-slate-500">{icon} {label}</p>
      <p className="text-xs font-bold truncate">{value}</p>
    </div>
  );
}

function ActionBtn({ onClick, label, hotkey }: { onClick: () => void; label: string; hotkey?: string }) {
  return (
    <button onClick={onClick} className="px-2 py-1.5 bg-slate-700/80 hover:bg-slate-600 rounded text-xs transition flex items-center justify-between">
      <span>{label}</span>
      {hotkey && <span className="text-[9px] text-slate-500 ml-1">{hotkey}</span>}
    </button>
  );
}

function PlayerStatusPanel({ state }: { state: GameState }) {
  const shipData = SHIP_UPGRADES[state.shipLevel - 1];
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
      <h3 className="font-bold text-cyan-400 text-sm mb-2">🎮 플레이어</h3>
      <div className="space-y-1.5 text-xs">
        <Row label="선박" value={`Lv.${state.shipLevel} ${shipData?.name}`} />
        <Row label="화물" value={`${state.cargo.length}/${shipData?.cargoCapacity}`} />
        <Row label="상태" value={state.inWater ? '🟢 수중' : '⚪ 선박'} />
        {state.inWater && (
          <>
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                <span>산소</span><span>{Math.round(state.airRemaining)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${state.airRemaining > 30 ? 'bg-cyan-500' : 'bg-red-500 animate-pulse'}`}
                  style={{ width: `${state.airRemaining}%` }} />
              </div>
            </div>
            <Row label="수심" value={`${Math.abs(Math.round(state.diverY))}m`} />
          </>
        )}
        <div className="border-t border-slate-700 pt-1.5 mt-1.5">
          <Row label="총 잠수" value={`${state.totalDives}회`} />
          <Row label="총 포획" value={`${state.totalCatches}마리`} />
          <Row label="발견" value={`${state.uniqueSpeciesCaught}/200종`} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

function MiniMap({ state }: { state: GameState }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
      <h3 className="font-bold text-cyan-400 text-sm mb-2">🗺️ 미니맵</h3>
      <div className="relative w-full aspect-[3/2] bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
        {/* Regions */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 opacity-50">
          <div className="bg-green-900/40 border-r border-b border-green-800/30" />
          <div className="bg-emerald-900/40 border-r border-b border-emerald-800/30" />
          <div className="bg-blue-900/40 border-b border-blue-800/30" />
          <div className="bg-blue-800/30 border-r border-blue-700/30" />
          <div className="bg-orange-900/40 border-r border-orange-800/30" />
          <div className="bg-purple-900/40" />
        </div>
        {/* Islands */}
        {ISLANDS.map(island => (
          <div key={island.id} className="absolute w-1.5 h-1.5 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(island.x / 4800) * 100}%`, top: `${(island.y / 3200) * 100}%` }}
            title={island.name} />
        ))}
        {/* Active creatures */}
        {state.activeSpecimens.slice(0, 30).map(spec => {
          const species = SPECIES_BY_ID.get(spec.speciesId);
          const color = species?.protected ? 'bg-yellow-400' : 'bg-cyan-400/50';
          return (
            <div key={spec.uid} className={`absolute w-1 h-1 ${color} rounded-full transform -translate-x-1/2 -translate-y-1/2`}
              style={{ left: `${(spec.x / 4800) * 100}%`, top: `${(spec.z / 3200) * 100}%` }} />
          );
        })}
        {/* Ship */}
        <div className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-yellow-400/50 animate-pulse"
          style={{ left: `${(state.shipX / 4800) * 100}%`, top: `${(state.shipZ / 3200) * 100}%` }} />
        {/* Diver */}
        {state.inWater && (
          <div className="absolute w-2 h-2 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg shadow-green-400/50"
            style={{ left: `${(state.diverX / 4800) * 100}%`, top: `${(state.diverZ / 3200) * 100}%` }} />
        )}
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-slate-500">
        <span>🟡 선박</span>
        <span>🟢 잠수</span>
        <span>🔵 생물</span>
      </div>
    </div>
  );
}

function DashboardPanel({ state, nearbyCreatures, selectedTarget, onSelectTarget, onAction }: {
  state: GameState;
  nearbyCreatures: typeof state.activeSpecimens;
  selectedTarget: string | null;
  onSelectTarget: (uid: string) => void;
  onAction: (a: any) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Movement & Status */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-cyan-400">
            {state.inWater ? '🤿 수중 모드' : '🚢 항해 모드'}
          </h2>
          <div className="flex gap-2">
            {state.inWater ? (
              <>
                <button onClick={() => onAction({ type: 'RETURN_TO_SHIP' })}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs">🚢 귀선 (Q)</button>
              </>
            ) : (
              <button onClick={() => onAction({ type: 'ENTER_WATER' })}
                className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs">🏊 입수 (E)</button>
            )}
          </div>
        </div>

        {/* Ship controls visual */}
        {!state.inWater && (
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 bg-slate-700/50 rounded-full border border-slate-600 flex items-center justify-center">
              <div className="absolute w-1 h-8 bg-yellow-400 rounded-full origin-bottom"
                style={{ transform: `rotate(${state.shipHeading * 180 / Math.PI}deg)` }} />
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <p>방위: {Math.round(state.shipHeading * 180 / Math.PI)}°</p>
              <p>속도: {SHIP_UPGRADES[state.shipLevel - 1]?.speed} m/s</p>
              <p>해역: {getRegionName(getRegionAt(state.shipX, state.shipZ))}</p>
            </div>
          </div>
        )}
      </div>

      {/* Nearby Creatures */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-base font-bold text-cyan-400 mb-3">
          🐠 주변 생물 ({nearbyCreatures.length}마리)
          {state.inWater && <span className="text-xs text-slate-400 ml-2">Tab으로 대상 전환</span>}
        </h2>
        {nearbyCreatures.length === 0 ? (
          <p className="text-slate-500 text-sm">
            {state.inWater ? '주변에 생물이 없습니다. 더 깊이 잠수해보세요.' : '입수하면 주변 생물을 볼 수 있습니다.'}
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1">
            {nearbyCreatures.map(spec => {
              const species = SPECIES_BY_ID.get(spec.speciesId);
              const dist = distance2D(spec.x, spec.z, state.diverX, state.diverZ);
              const isSelected = spec.uid === selectedTarget;
              return (
                <div key={spec.uid}
                  onClick={() => onSelectTarget(spec.uid)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition ${
                    isSelected ? 'bg-cyan-900/40 border border-cyan-500' : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                  }`}>
                  <div className="flex items-center gap-2">
                    {species?.protected && <span className="text-yellow-400">🛡️</span>}
                    <span className={species?.protected ? 'text-yellow-300' : 'text-white'}>{species?.name || `#${spec.speciesId}`}</span>
                    <span className="text-slate-500 text-[10px]">{spec.behaviorState}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{spec.lengthCm.toFixed(1)}cm / {spec.weightKg.toFixed(2)}kg</span>
                    <span className="text-slate-500">{dist.toFixed(1)}m</span>
                    <button onClick={(e) => { e.stopPropagation(); onAction({ type: 'OBSERVE_CREATURE', specimenId: spec.uid }); }}
                      className="px-2 py-0.5 bg-cyan-800 hover:bg-cyan-700 rounded text-[10px]">👁</button>
                    <button onClick={(e) => { e.stopPropagation(); onAction({ type: 'CATCH_ATTEMPT', specimenId: spec.uid, distanceM: dist }); }}
                      disabled={species?.protected}
                      className="px-2 py-0.5 bg-red-800 hover:bg-red-700 disabled:bg-slate-700 disabled:opacity-50 rounded text-[10px]">🎯</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cargo */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-cyan-400">📦 화물 ({state.cargo.length}/{SHIP_UPGRADES[state.shipLevel - 1]?.cargoCapacity})</h2>
          {state.cargo.length > 0 && (
            <button onClick={() => onAction({ type: 'SELL_ALL' })}
              className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-xs">💰 전체 판매 (Enter)</button>
          )}
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {state.cargo.length === 0 ? (
            <p className="text-slate-500 text-xs">화물이 비어있습니다</p>
          ) : (
            state.cargo.map(spec => {
              const species = SPECIES_BY_ID.get(spec.speciesId);
              return (
                <div key={spec.uid} className="flex justify-between bg-slate-700/30 rounded px-3 py-1 text-xs">
                  <span className="text-slate-200">{species?.name}</span>
                  <span className="text-slate-400">{spec.lengthCm.toFixed(1)}cm / {spec.weightKg.toFixed(2)}kg</span>
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
  const observed = entries.filter(e => e.observeCount > 0).length;

  // Region stats
  const regionStats = useMemo(() => {
    const stats: Record<Region, { total: number; discovered: number }> = {
      tropical: { total: 0, discovered: 0 }, glacier: { total: 0, discovered: 0 },
      volcanic: { total: 0, discovered: 0 }, mangrove: { total: 0, discovered: 0 },
      ocean: { total: 0, discovered: 0 }, deepsea: { total: 0, discovered: 0 },
    };
    for (const s of SPECIES_DATA) stats[s.region].total++;
    for (const e of entries) {
      const species = SPECIES_BY_ID.get(e.speciesId);
      if (species) stats[species.region].discovered++;
    }
    return stats;
  }, [entries]);

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-3">📖 도감</h2>

      {/* Progress */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">{entries.length}</p>
          <p className="text-xs text-slate-400">발견</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{caught}</p>
          <p className="text-xs text-slate-400">포획</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{observed}</p>
          <p className="text-xs text-slate-400">관찰</p>
        </div>
      </div>

      {/* Region progress */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {(Object.entries(regionStats) as [Region, { total: number; discovered: number }][]).map(([region, stats]) => (
          <div key={region} className="bg-slate-700/20 rounded p-2">
            <div className="flex justify-between text-xs mb-1">
              <span>{getRegionName(region)}</span>
              <span className="text-slate-400">{stats.discovered}/{stats.total}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1">
              <div className="bg-cyan-500 h-1 rounded-full" style={{ width: `${(stats.discovered / stats.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Species list */}
      <div className="max-h-96 overflow-y-auto space-y-1">
        {entries.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">아직 발견한 생물이 없습니다</p>
        ) : (
          entries.sort((a, b) => a.speciesId - b.speciesId).map(entry => {
            const species = SPECIES_BY_ID.get(entry.speciesId);
            if (!species) return null;
            return (
              <div key={entry.speciesId} className="bg-slate-700/30 rounded-lg p-2.5 hover:bg-slate-700/50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-sm">{species.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2 italic">{species.scientificName}</span>
                    {species.protected && <span className="ml-1 text-yellow-400 text-[10px]">🛡️</span>}
                  </div>
                  <span className="text-[10px] text-slate-500">#{species.id}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-1.5 text-[10px] text-slate-400">
                  <span>포획:{entry.catchCount}</span>
                  <span>관찰:{entry.observeCount}</span>
                  <span>최장:{entry.maxLengthCm.toFixed(1)}cm</span>
                  <span>최중:{entry.maxWeightKg.toFixed(2)}kg</span>
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
    <div className="space-y-4">
      {/* Harpoons */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-base font-bold text-cyan-400 mb-3">🔱 작살 ({state.ownedHarpoons.length}/24)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {HARPOONS.map(h => {
            const owned = state.ownedHarpoons.includes(h.id);
            const equipped = state.equippedHarpoon === h.id;
            return (
              <div key={h.id} className={`rounded-lg p-2 text-xs border transition ${
                equipped ? 'bg-cyan-900/30 border-cyan-500' : owned ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700 opacity-70'
              }`}>
                <div className="flex justify-between">
                  <span className="font-medium truncate">{h.name}</span>
                  <span className="text-slate-400 shrink-0 ml-1">{h.price > 0 ? `🐚${h.price}` : '기본'}</span>
                </div>
                <div className="text-slate-500 text-[10px] mt-0.5">
                  사거리:{h.range}m | 속도:{h.speed} | 안정:{h.stability} | +{(h.catchBonus * 100).toFixed(0)}%
                </div>
                <div className="mt-1">
                  {equipped ? <span className="text-cyan-400 text-[10px]">✓ 장착중</span> :
                    owned ? <button onClick={() => onAction({ type: 'EQUIP_ITEM', itemType: 'harpoon', itemId: h.id })}
                      className="text-[10px] text-blue-400 hover:text-blue-300">장착</button> :
                    <button onClick={() => onAction({ type: 'BUY_ITEM', itemType: 'harpoon', itemId: h.id })}
                      className="text-[10px] text-yellow-400 hover:text-yellow-300">구매</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tanks & Suits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <h2 className="text-base font-bold text-cyan-400 mb-3">🫧 산소통</h2>
          <div className="space-y-2">
            {TANKS.map(t => {
              const owned = state.ownedTanks.includes(t.id);
              const equipped = state.equippedTank === t.id;
              return (
                <div key={t.id} className={`rounded p-2 text-xs border ${
                  equipped ? 'bg-cyan-900/30 border-cyan-500' : owned ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700'
                }`}>
                  <div className="flex justify-between">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-slate-400">{t.price > 0 ? `🐚${t.price}` : '기본'}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">용량:{t.airCapacity} | 속도:{t.moveModifier}x</div>
                  <div className="mt-0.5">
                    {equipped ? <span className="text-cyan-400 text-[10px]">✓ 장착중</span> :
                      owned ? <button onClick={() => onAction({ type: 'EQUIP_ITEM', itemType: 'tank', itemId: t.id })}
                        className="text-[10px] text-blue-400">장착</button> :
                      <button onClick={() => onAction({ type: 'BUY_ITEM', itemType: 'tank', itemId: t.id })}
                        className="text-[10px] text-yellow-400">구매</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <h2 className="text-base font-bold text-cyan-400 mb-3">🤿 잠수복</h2>
          <div className="space-y-2">
            {SUITS.map(s => {
              const owned = state.ownedSuits.includes(s.id);
              const equipped = state.equippedSuit === s.id;
              return (
                <div key={s.id} className={`rounded p-2 text-xs border ${
                  equipped ? 'bg-cyan-900/30 border-cyan-500' : owned ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700'
                }`}>
                  <div className="flex justify-between">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-slate-400">{s.price > 0 ? `🐚${s.price}` : '기본'}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">방어:{(s.envProtection * 100).toFixed(0)}% | 시야:+{(s.visionBonus * 100).toFixed(0)}%</div>
                  <div className="mt-0.5">
                    {equipped ? <span className="text-cyan-400 text-[10px]">✓ 장착중</span> :
                      owned ? <button onClick={() => onAction({ type: 'EQUIP_ITEM', itemType: 'suit', itemId: s.id })}
                        className="text-[10px] text-blue-400">장착</button> :
                      <button onClick={() => onAction({ type: 'BUY_ITEM', itemType: 'suit', itemId: s.id })}
                        className="text-[10px] text-yellow-400">구매</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ship Upgrades */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-base font-bold text-cyan-400 mb-3">🚢 선박 개조</h2>
        <div className="flex gap-2">
          {SHIP_UPGRADES.map(s => (
            <div key={s.level} className={`flex-1 rounded-lg p-2 text-xs border text-center ${
              state.shipLevel === s.level ? 'bg-cyan-900/30 border-cyan-500' :
              state.shipLevel > s.level ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700'
            }`}>
              <span className="font-medium block">Lv.{s.level}</span>
              <span className="text-[10px] text-slate-400">{s.name}</span>
              <div className="text-[10px] text-slate-500 mt-1">
                속도:{s.speed} | 창고:{s.cargoCapacity}
              </div>
              {state.shipLevel === s.level && <span className="text-cyan-400 text-[10px]">현재</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorldPanel({ state }: { state: GameState }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-3">🗺️ 월드 (4800×3200m)</h2>

      {/* Large Map */}
      <div className="relative w-full aspect-[3/2] bg-slate-900 rounded-lg border border-slate-600 mb-4 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
          <div className="bg-green-900/30 border border-green-800/20 flex items-center justify-center text-xs text-green-400">🌴 열대</div>
          <div className="bg-emerald-900/30 border border-emerald-800/20 flex items-center justify-center text-xs text-emerald-400">🌿 맹그로브</div>
          <div className="bg-blue-900/30 border border-blue-800/20 flex items-center justify-center text-xs text-blue-400">🧊 빙하</div>
          <div className="bg-blue-800/20 border border-blue-700/20 flex items-center justify-center text-xs text-blue-300">🌊 대양</div>
          <div className="bg-orange-900/30 border border-orange-800/20 flex items-center justify-center text-xs text-orange-400">🌋 화산</div>
          <div className="bg-purple-900/30 border border-purple-800/20 flex items-center justify-center text-xs text-purple-400">🌑 심해</div>
        </div>
        {ISLANDS.map(island => (
          <div key={island.id} className="absolute w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition"
            style={{ left: `${(island.x / 4800) * 100}%`, top: `${(island.y / 3200) * 100}%` }}
            title={`${island.name} (${island.x}, ${island.y})`} />
        ))}
        <div className="absolute w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse shadow-lg shadow-yellow-400/50"
          style={{ left: `${(state.shipX / 4800) * 100}%`, top: `${(state.shipZ / 3200) * 100}%` }} title="선박" />
      </div>

      {/* Island List */}
      <h3 className="text-sm font-medium text-slate-300 mb-2">섬 & 항구 ({ISLANDS.length}개)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {ISLANDS.map(island => (
          <div key={island.id} className="bg-slate-700/30 rounded p-2 text-xs hover:bg-slate-700/50 transition">
            <div className="flex justify-between">
              <span className="font-medium">{island.name}</span>
              <span className="text-slate-500 text-[10px]">{getRegionName(island.region)}</span>
            </div>
            <p className="text-slate-500 text-[10px] mt-0.5">{island.description}</p>
            <div className="text-[10px] text-slate-400 mt-1">
              {island.hasPort && '🏪 '} {island.hasShop && '🛒 '} {island.hasDock && '⚓ '}
              <span className="text-slate-500">({island.x}, {island.y})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanionsPanel({ state, onAction }: { state: GameState; onAction: (a: any) => void }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-4">👥 동료 ({state.companions.length}/3)</h2>
      <div className="space-y-3">
        {COMPANIONS.map(c => {
          const recruited = state.companions.includes(c.id);
          return (
            <div key={c.id} className={`rounded-xl p-4 border transition ${
              recruited ? 'bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-cyan-500' : 'bg-slate-700/30 border-slate-600'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-lg">{c.name}</span>
                  <span className="text-slate-400 ml-2 text-sm">{c.role}</span>
                </div>
                {recruited ? (
                  <span className="px-2 py-0.5 bg-cyan-800 text-cyan-300 rounded text-xs">✓ 합류</span>
                ) : (
                  <button onClick={() => onAction({ type: 'RECRUIT_COMPANION', companionId: c.id })}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs transition">영입</button>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-2">{c.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-emerald-400">
                  보너스: {c.bonus.type === 'catch' ? '🎯 포획' : c.bonus.type === 'sell' ? '💰 판매' : c.bonus.type === 'observation' ? '👁 관찰' : '💨 속도'}
                  +{(c.bonus.value * 100).toFixed(0)}%
                </span>
                <span className="text-yellow-400">해금: {c.unlockCondition}</span>
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
    <div className="space-y-4">
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🦴 화석 & 보스 ({state.fossils.length}/15)</h2>
        {BOSSES.map(boss => {
          const bossFossils = FOSSILS.filter(f => f.bossId === boss.id);
          const collected = bossFossils.filter(f => state.fossils.includes(f.id));
          const canSummon = collected.length >= boss.fossilRequired && !state.bossActive;
          return (
            <div key={boss.id} className="mb-4 bg-slate-700/30 rounded-xl p-4 border border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="font-bold text-lg">{boss.name}</span>
                  <span className="text-slate-500 text-xs ml-2 italic">{boss.scientificName}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-slate-400">HP: {boss.hp.toLocaleString()}</span>
                  <span className="text-xs text-yellow-400 ml-2">🐚{boss.rewardShells.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                {bossFossils.map(f => (
                  <div key={f.id} className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm border ${
                    state.fossils.includes(f.id) ? 'bg-yellow-800/50 border-yellow-500' : 'bg-slate-700 border-slate-600'
                  }`}>
                    {state.fossils.includes(f.id) ? '🦴' : '?'}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => onAction({ type: 'SUMMON_BOSS', bossId: boss.id })}
                  disabled={!canSummon}
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:opacity-50 rounded text-xs font-medium transition">
                  ⚔️ 소환
                </button>
                <span className="text-xs text-slate-400">{collected.length}/{boss.fossilRequired} 조각</span>
              </div>
              {state.bossActive === boss.id && (
                <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-400">⚔️ 전투 중</span>
                    <span>{state.bossHp.toLocaleString()}/{boss.hp.toLocaleString()} HP</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                    <div className="bg-red-500 h-3 rounded-full transition-all" style={{ width: `${(state.bossHp / boss.hp) * 100}%` }} />
                  </div>
                  <button onClick={() => onAction({ type: 'ATTACK_BOSS', damage: 200 })}
                    className="px-4 py-1.5 bg-orange-700 hover:bg-orange-600 rounded text-xs font-medium">
                    ⚔️ 공격 (200 데미지)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavesPanel({ slots, onSave, onLoad }: { slots: SaveSlot[]; onSave: (id: number) => void; onLoad: (id: number) => void }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-4">💾 저장 관리</h2>
      <div className="space-y-3">
        {slots.map(slot => (
          <div key={slot.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold">{slot.name}</span>
                {slot.timestamp > 0 && (
                  <span className="text-xs text-slate-400 ml-2">{SaveManager.formatDate(slot.timestamp)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onSave(slot.id)}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-xs">💾 저장</button>
                <button onClick={() => onLoad(slot.id)}
                  disabled={slot.timestamp === 0}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 disabled:opacity-50 rounded text-xs">📂 불러오기</button>
              </div>
            </div>
            {slot.timestamp > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-3 text-xs text-slate-400">
                <div><span className="text-slate-500">플레이:</span> {SaveManager.formatPlayTime(slot.playTimeSec)}</div>
                <div><span className="text-slate-500">조개:</span> 🐚{slot.shells.toLocaleString()}</div>
                <div><span className="text-slate-500">발견:</span> {slot.speciesDiscovered}종</div>
                <div><span className="text-slate-500">선박:</span> Lv.{slot.shipLevel}</div>
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
    <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-cyan-400">🧪 게임 엔진 테스트</h2>
        <button onClick={onRun} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded text-sm font-medium transition">
          ▶ 테스트 실행
        </button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">위의 "테스트 실행" 버튼을 클릭하세요</p>
          <p className="text-xs text-slate-500">12개 테스트가 게임 엔진의 무결성을 검증합니다</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-4">
            <div className={`text-3xl font-bold ${passed === total ? 'text-emerald-400' : 'text-red-400'}`}>
              {passed}/{total}
            </div>
            <div className="flex-1">
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${passed === total ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${(passed / total) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`rounded-lg p-3 border ${
                r.passed ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-red-900/20 border-red-700/50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.passed ? '✅' : '❌'}</span>
                  <span className="font-medium text-sm">{r.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 ml-7">{r.message}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
