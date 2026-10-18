import { useState, useEffect, useCallback, useRef } from 'react';
import { createGame, type GameState } from './core/GameEngine';
import { SPECIES_BY_ID, type Region } from './data/species';
import { HARPOONS, TANKS, SUITS, SHIP_UPGRADES } from './data/equipment';
import { ISLANDS, COMPANIONS, BOSSES, FOSSILS, WORLD_CONFIG } from './data/world';
import { runAllTests, type TestResult } from './tests/gameEngine.test';

type TabType = 'dashboard' | 'codex' | 'equipment' | 'world' | 'tests' | 'companions' | 'fossils';

function App() {
  const [game] = useState(() => createGame({ seed: 12345 }));
  const [state, setState] = useState<GameState>(game.getSnapshot());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  }, []);

  // Game loop
  useEffect(() => {
    const unsubscribe = game.subscribe((newState) => {
      setState(newState);
    });

    intervalRef.current = setInterval(() => {
      game.dispatch({ type: 'TICK', dtSec: 1 / 30 });
    }, 1000 / 30);

    return () => {
      unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [game]);

  const handleAction = (action: { type: string; [key: string]: unknown }) => {
    const result = game.dispatch(action);
    if (result.success) {
      addLog(`✓ ${action.type} 성공`);
    } else {
      addLog(`✗ ${action.type} 실패: ${result.reason}`);
    }
  };

  const handleTest = () => {
    const results = runAllTests();
    setTestResults(results);
    addLog(`테스트 실행 완료: ${results.filter(r => r.passed).length}/${results.length} 통과`);
  };

  const handleSave = () => {
    const result = game.save();
    addLog(result.success ? '💾 저장 완료' : '저장 실패');
  };

  const handleLoad = () => {
    const result = game.load();
    addLog(result.success ? '📂 불러오기 완료' : '불러오기 실패');
  };

  const getRegionName = (region: Region): string => {
    const names: Record<Region, string> = {
      tropical: '🌴 열대',
      glacier: '🧊 빙하',
      volcanic: '🌋 화산',
      mangrove: '🌿 맹그로브',
      ocean: '🌊 대양',
      deepsea: '🌑 심해'
    };
    return names[region];
  };

  const currentRegion = getRegionAt(state.shipX, state.shipZ);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800/80 border-b border-blue-500/30 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              🌊 OCEAN GAIA V3.2
            </h1>
            <p className="text-xs text-slate-400 mt-1">Session B — Game Systems & Data Engine</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition">
              💾 저장
            </button>
            <button onClick={handleLoad} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition">
              📂 불러오기
            </button>
            <button onClick={handleTest} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium transition">
              🧪 테스트
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <StatusCard label="조개" value={`🐚 ${state.shells.toLocaleString()}`} />
          <StatusCard label="위치" value={`${Math.round(state.shipX)}, ${Math.round(state.shipZ)}`} />
          <StatusCard label="해역" value={getRegionName(currentRegion)} />
          <StatusCard label="시간" value={`Day ${state.day} ${Math.floor(state.hour)}:00`} />
          <StatusCard label="날씨" value={getWeatherIcon(state.weather)} />
          <StatusCard label="호칭" value={state.title} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['dashboard', 'codex', 'equipment', 'world', 'companions', 'fossils', 'tests'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'dashboard' && <DashboardPanel state={state} onAction={handleAction} />}
            {activeTab === 'codex' && <CodexPanel state={state} />}
            {activeTab === 'equipment' && <EquipmentPanel state={state} onAction={handleAction} />}
            {activeTab === 'world' && <WorldPanel state={state} />}
            {activeTab === 'companions' && <CompanionsPanel state={state} onAction={handleAction} />}
            {activeTab === 'fossils' && <FossilsPanel state={state} onAction={handleAction} />}
            {activeTab === 'tests' && <TestsPanel results={testResults} />}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Player Status */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <h3 className="font-bold text-cyan-400 mb-3">🎮 플레이어 상태</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">선박 레벨</span>
                  <span>Lv.{state.shipLevel} {SHIP_UPGRADES[state.shipLevel - 1]?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">화물</span>
                  <span>{state.cargo.length}/{SHIP_UPGRADES[state.shipLevel - 1]?.cargoCapacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">수중 여부</span>
                  <span>{state.inWater ? '🟢 수중' : '⚪ 선박'}</span>
                </div>
                {state.inWater && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">산소</span>
                      <span>{Math.round(state.airRemaining)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${state.airRemaining > 30 ? 'bg-cyan-500' : 'bg-red-500'}`}
                        style={{ width: `${state.airRemaining}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">총 잠수</span>
                  <span>{state.totalDives}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">총 포획</span>
                  <span>{state.totalCatches}마리</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">발견 종</span>
                  <span>{state.uniqueSpeciesCaught}/200</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <h3 className="font-bold text-cyan-400 mb-3">⚡ 빠른 조작</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleAction({ type: 'ENTER_WATER' })}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded text-xs transition">
                  🏊 입수
                </button>
                <button onClick={() => handleAction({ type: 'RETURN_TO_SHIP' })}
                  className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs transition">
                  🚢 귀선
                </button>
                <button onClick={() => handleAction({ type: 'SELL_ALL' })}
                  className="px-3 py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-xs transition">
                  💰 전체 판매
                </button>
                <button onClick={() => handleAction({ type: 'UPGRADE_SHIP' })}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-600 rounded text-xs transition">
                  ⬆️ 선박 개조
                </button>
              </div>
            </div>

            {/* Log */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <h3 className="font-bold text-cyan-400 mb-3">📋 로그</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-xs">조작 기록이 여기에 표시됩니다</p>
                ) : (
                  logs.map((log, i) => (
                    <p key={i} className="text-xs text-slate-300 font-mono">{log}</p>
                  ))
                )}
              </div>
            </div>

            {/* Engine Info */}
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
              <h3 className="font-bold text-cyan-400 mb-3">⚙️ 엔진 정보</h3>
              <div className="space-y-1 text-xs text-slate-400">
                <p>버전: {state.version}</p>
                <p>시드: {state.seed}</p>
                <p>틱: {state.tick}</p>
                <p>게임시간: {Math.floor(state.gameTimeSec)}초</p>
                <p>활성 개체: {state.activeSpecimens.length}</p>
                <p>Three.js: 미사용 (세션 B)</p>
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

function getWeatherIcon(weather: string): string {
  const icons: Record<string, string> = {
    clear: '☀️ 맑음',
    cloudy: '☁️ 흐림',
    rain: '🌧️ 비',
    storm: '⛈️ 폭풍',
    fog: '🌫️ 안개',
    snow: '🌨️ 눈'
  };
  return icons[weather] || weather;
}

function getTabLabel(tab: TabType): string {
  const labels: Record<TabType, string> = {
    dashboard: '🎯 대시보드',
    codex: '📖 도감',
    equipment: '🔧 장비',
    world: '🗺️ 월드',
    companions: '👥 동료',
    fossils: '🦴 화석',
    tests: '🧪 테스트'
  };
  return labels[tab];
}

// ─── Components ───

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold truncate">{value}</p>
    </div>
  );
}

function DashboardPanel({ state, onAction }: { state: GameState; onAction: (a: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🎮 게임 대시보드</h2>

        {/* Movement Controls */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">선박 이동</h3>
          <div className="grid grid-cols-3 gap-2 max-w-48">
            <div />
            <button onClick={() => onAction({ type: 'MOVE_SHIP', forward: 1, turn: 0, dtSec: 0.1 })}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs">▲ 전진</button>
            <div />
            <button onClick={() => onAction({ type: 'MOVE_SHIP', forward: 0, turn: -1, dtSec: 0.1 })}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs">◀ 좌회전</button>
            <button onClick={() => onAction({ type: 'MOVE_SHIP', forward: -1, turn: 0, dtSec: 0.1 })}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs">▼ 후진</button>
            <button onClick={() => onAction({ type: 'MOVE_SHIP', forward: 0, turn: 1, dtSec: 0.1 })}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-xs">▶ 우회전</button>
          </div>
        </div>

        {/* Active Specimens */}
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-2">
            주변 생물 ({state.activeSpecimens.length}마리)
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {state.activeSpecimens.slice(0, 20).map(spec => {
              const species = SPECIES_BY_ID.get(spec.speciesId);
              return (
                <div key={spec.uid} className="flex items-center justify-between bg-slate-700/30 rounded px-3 py-1.5 text-xs">
                  <span className={species?.protected ? 'text-yellow-400' : 'text-slate-200'}>
                    {species?.protected && '🛡️ '}{species?.name || `ID:${spec.speciesId}`}
                  </span>
                  <span className="text-slate-400">
                    {spec.lengthCm.toFixed(1)}cm / {spec.weightKg.toFixed(2)}kg
                  </span>
                  <button
                    onClick={() => onAction({ type: 'OBSERVE_CREATURE', specimenId: spec.uid })}
                    className="px-2 py-0.5 bg-cyan-700 hover:bg-cyan-600 rounded text-xs"
                  >
                    👁 관찰
                  </button>
                  <button
                    onClick={() => onAction({ type: 'CATCH_ATTEMPT', specimenId: spec.uid, distanceM: 3 })}
                    className="px-2 py-0.5 bg-red-700 hover:bg-red-600 rounded text-xs"
                    disabled={species?.protected}
                  >
                    🎯 포획
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cargo */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">
            화물 ({state.cargo.length}마리)
          </h3>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {state.cargo.map(spec => {
              const species = SPECIES_BY_ID.get(spec.speciesId);
              return (
                <div key={spec.uid} className="flex items-center justify-between bg-slate-700/30 rounded px-3 py-1 text-xs">
                  <span className="text-slate-200">{species?.name}</span>
                  <span className="text-slate-400">{spec.lengthCm.toFixed(1)}cm</span>
                </div>
              );
            })}
            {state.cargo.length === 0 && <p className="text-slate-500 text-xs">화물이 비어있습니다</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CodexPanel({ state }: { state: GameState }) {
  const entries = Object.values(state.codex);
  const discovered = entries.length;

  return (
    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-4">📖 도감 ({discovered}/200)</h2>
      <div className="mb-4">
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div className="bg-cyan-500 h-3 rounded-full transition-all" style={{ width: `${(discovered / 200) * 100}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-1">{((discovered / 200) * 100).toFixed(1)}% 완성</p>
      </div>
      <div className="max-h-96 overflow-y-auto space-y-2">
        {entries.length === 0 ? (
          <p className="text-slate-500 text-sm">아직 발견한 생물이 없습니다. 잠수해서 생물을 만나보세요!</p>
        ) : (
          entries.map(entry => {
            const species = SPECIES_BY_ID.get(entry.speciesId);
            if (!species) return null;
            return (
              <div key={entry.speciesId} className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-white">{species.name}</span>
                    <span className="text-xs text-slate-400 ml-2 italic">{species.scientificName}</span>
                    {species.protected && <span className="ml-2 text-yellow-400 text-xs">🛡️ 보호종</span>}
                  </div>
                  <span className="text-xs text-slate-400">#{species.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-300">
                  <span>포획: {entry.catchCount}회</span>
                  <span>관찰: {entry.observeCount}회</span>
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
    <div className="space-y-4">
      {/* Harpoons */}
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🔱 작살 ({state.ownedHarpoons.length}/24)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {HARPOONS.map(h => (
            <div key={h.id} className={`rounded-lg p-2 text-xs border ${
              state.equippedHarpoon === h.id ? 'bg-cyan-900/30 border-cyan-500' :
              state.ownedHarpoons.includes(h.id) ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700'
            }`}>
              <div className="flex justify-between">
                <span className="font-medium">{h.name}</span>
                <span className="text-slate-400">{h.price > 0 ? `🐚${h.price}` : '기본'}</span>
              </div>
              <div className="text-slate-400 mt-1">
                사거리:{h.range}m | 속도:{h.speed} | 안정:{h.stability}
              </div>
              <div className="flex gap-1 mt-1">
                {state.ownedHarpoons.includes(h.id) ? (
                  state.equippedHarpoon === h.id ? (
                    <span className="text-cyan-400">장착중</span>
                  ) : (
                    <button onClick={() => onAction({ type: 'EQUIP_ITEM', itemType: 'harpoon', itemId: h.id })}
                      className="text-xs text-blue-400 hover:text-blue-300">장착</button>
                  )
                ) : (
                  <button onClick={() => onAction({ type: 'BUY_ITEM', itemType: 'harpoon', itemId: h.id })}
                    className="text-xs text-yellow-400 hover:text-yellow-300">구매</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tanks */}
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🫧 산소통 ({state.ownedTanks.length}/6)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {TANKS.map(t => (
            <div key={t.id} className={`rounded-lg p-2 text-xs border ${
              state.equippedTank === t.id ? 'bg-cyan-900/30 border-cyan-500' :
              state.ownedTanks.includes(t.id) ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700'
            }`}>
              <span className="font-medium">{t.name}</span>
              <div className="text-slate-400">용량:{t.airCapacity} | 속도:{t.moveModifier}x</div>
              <div className="mt-1">
                {state.ownedTanks.includes(t.id) ? (
                  state.equippedTank === t.id ? <span className="text-cyan-400">장착중</span> :
                  <button onClick={() => onAction({ type: 'EQUIP_ITEM', itemType: 'tank', itemId: t.id })}
                    className="text-xs text-blue-400">장착</button>
                ) : (
                  <button onClick={() => onAction({ type: 'BUY_ITEM', itemType: 'tank', itemId: t.id })}
                    className="text-xs text-yellow-400">구매 🐚{t.price}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suits */}
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🤿 잠수복 ({state.ownedSuits.length}/6)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {SUITS.map(s => (
            <div key={s.id} className={`rounded-lg p-2 text-xs border ${
              state.equippedSuit === s.id ? 'bg-cyan-900/30 border-cyan-500' :
              state.ownedSuits.includes(s.id) ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700'
            }`}>
              <span className="font-medium">{s.name}</span>
              <div className="text-slate-400">방어:{(s.envProtection * 100).toFixed(0)}% | 시야:+{(s.visionBonus * 100).toFixed(0)}%</div>
              <div className="mt-1">
                {state.ownedSuits.includes(s.id) ? (
                  state.equippedSuit === s.id ? <span className="text-cyan-400">장착중</span> :
                  <button onClick={() => onAction({ type: 'EQUIP_ITEM', itemType: 'suit', itemId: s.id })}
                    className="text-xs text-blue-400">장착</button>
                ) : (
                  <button onClick={() => onAction({ type: 'BUY_ITEM', itemType: 'suit', itemId: s.id })}
                    className="text-xs text-yellow-400">구매 🐚{s.price}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ship */}
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🚢 선박 (Lv.{state.shipLevel})</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {SHIP_UPGRADES.map(s => (
            <div key={s.level} className={`rounded-lg p-2 text-xs border ${
              state.shipLevel === s.level ? 'bg-cyan-900/30 border-cyan-500' :
              state.shipLevel > s.level ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-800/30 border-slate-700'
            }`}>
              <span className="font-medium">Lv.{s.level} {s.name}</span>
              <div className="text-slate-400">속도:{s.speed} | 창고:{s.cargoCapacity}</div>
              <div className="text-slate-400">탐사:{s.explorationRange}m</div>
              {state.shipLevel === s.level && <span className="text-cyan-400">현재</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorldPanel({ state }: { state: GameState }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-4">🗺️ 월드 (4800×3200m)</h2>

      {/* Mini Map */}
      <div className="relative w-full aspect-[3/2] bg-slate-900 rounded-lg border border-slate-600 mb-4 overflow-hidden">
        {/* Region backgrounds */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
          <div className="bg-green-900/30 border border-green-800/30 flex items-center justify-center text-xs text-green-400">🌴 열대</div>
          <div className="bg-emerald-900/30 border border-emerald-800/30 flex items-center justify-center text-xs text-emerald-400">🌿 맹그로브</div>
          <div className="bg-blue-900/30 border border-blue-800/30 flex items-center justify-center text-xs text-blue-400">🧊 빙하</div>
          <div className="bg-blue-900/20 border border-blue-800/30 flex items-center justify-center text-xs text-blue-300">🌊 대양</div>
          <div className="bg-orange-900/30 border border-orange-800/30 flex items-center justify-center text-xs text-orange-400">🌋 화산</div>
          <div className="bg-purple-900/30 border border-purple-800/30 flex items-center justify-center text-xs text-purple-400">🌑 심해</div>
        </div>

        {/* Islands */}
        {ISLANDS.map(island => (
          <div
            key={island.id}
            className="absolute w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(island.x / 4800) * 100}%`,
              top: `${(island.y / 3200) * 100}%`
            }}
            title={island.name}
          />
        ))}

        {/* Ship */}
        <div
          className="absolute w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{
            left: `${(state.shipX / 4800) * 100}%`,
            top: `${(state.shipZ / 3200) * 100}%`
          }}
          title="선박"
        />
      </div>

      {/* Island List */}
      <h3 className="text-sm font-medium text-slate-300 mb-2">섬 목록 ({ISLANDS.length}개)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {ISLANDS.map(island => (
          <div key={island.id} className="bg-slate-700/30 rounded p-2 text-xs">
            <span className="font-medium">{island.name}</span>
            <span className="text-slate-400 ml-2">({island.x}, {island.y})</span>
            <div className="text-slate-400 mt-1">
              {island.hasPort && '🏪 항구 '}
              {island.hasShop && '🛒 상점 '}
              {island.hasDock && '⚓ 부두 '}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompanionsPanel({ state, onAction }: { state: GameState; onAction: (a: any) => void }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-4">👥 동료 ({state.companions.length}/3)</h2>
      <div className="space-y-3">
        {COMPANIONS.map(c => {
          const recruited = state.companions.includes(c.id);
          return (
            <div key={c.id} className={`rounded-lg p-4 border ${
              recruited ? 'bg-cyan-900/20 border-cyan-500' : 'bg-slate-700/30 border-slate-600'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-white">{c.name}</span>
                  <span className="text-slate-400 ml-2 text-sm">{c.role}</span>
                </div>
                {recruited ? (
                  <span className="text-cyan-400 text-sm">✓ 합류 완료</span>
                ) : (
                  <button
                    onClick={() => onAction({ type: 'RECRUIT_COMPANION', companionId: c.id })}
                    className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs"
                  >
                    영입
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-2">{c.description}</p>
              <p className="text-xs text-slate-400 mt-1">
                보너스: {c.bonus.type === 'catch' ? '포확률' : c.bonus.type === 'sell' ? '판매' : c.bonus.type === 'observation' ? '관찰' : '속도'} +{(c.bonus.value * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-yellow-400 mt-1">해금: {c.unlockCondition}</p>
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
      <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-bold text-cyan-400 mb-4">🦴 화석 수집 ({state.fossils.length}/15)</h2>
        {BOSSES.map(boss => {
          const bossFossils = FOSSILS.filter(f => f.bossId === boss.id);
          const collected = bossFossils.filter(f => state.fossils.includes(f.id));
          return (
            <div key={boss.id} className="mb-4 bg-slate-700/30 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">{boss.name}</span>
                <span className="text-sm text-slate-400">{collected.length}/{boss.fossilRequired} 조각</span>
              </div>
              <div className="flex gap-1 mb-2">
                {bossFossils.map(f => (
                  <div key={f.id} className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                    state.fossils.includes(f.id) ? 'bg-yellow-600' : 'bg-slate-600'
                  }`}>
                    {state.fossils.includes(f.id) ? '🦴' : '?'}
                  </div>
                ))}
              </div>
              <button
                onClick={() => onAction({ type: 'SUMMON_BOSS', bossId: boss.id })}
                disabled={collected.length < boss.fossilRequired || state.bossActive !== null}
                className="px-3 py-1 bg-red-700 hover:bg-red-600 disabled:bg-slate-600 disabled:opacity-50 rounded text-xs"
              >
                ⚔️ 소환 (HP: {boss.hp})
              </button>
              {state.bossActive === boss.id && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>보스 HP</span>
                    <span>{state.bossHp}/{boss.hp}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(state.bossHp / boss.hp) * 100}%` }} />
                  </div>
                  <button
                    onClick={() => onAction({ type: 'ATTACK_BOSS', damage: 100 })}
                    className="mt-2 px-3 py-1 bg-orange-700 hover:bg-orange-600 rounded text-xs"
                  >
                    ⚔️ 공격 (100 데미지)
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

function TestsPanel({ results }: { results: TestResult[] }) {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  return (
    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
      <h2 className="text-lg font-bold text-cyan-400 mb-4">🧪 게임 엔진 테스트</h2>
      {results.length === 0 ? (
        <p className="text-slate-400">상단의 "테스트" 버튼을 클릭하여 실행하세요.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <span className={`text-2xl font-bold ${passed === total ? 'text-emerald-400' : 'text-red-400'}`}>
              {passed}/{total}
            </span>
            <span className="text-slate-400">통과</span>
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`rounded-lg p-3 border ${
                r.passed ? 'bg-emerald-900/20 border-emerald-700' : 'bg-red-900/20 border-red-700'
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

      <div className="mt-6 bg-slate-700/30 rounded-lg p-4">
        <h3 className="font-bold text-sm text-slate-300 mb-2">📋 테스트 목록</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>1. 200종 데이터 로딩</li>
          <li>2. 학명 및 ID 중복 검사</li>
          <li>3. 길이·무게 생성 검사</li>
          <li>4. 체장–체중 계산 단위 검사</li>
          <li>5. 최대 길이 초과 검사</li>
          <li>6. 포획 가능 여부 검사</li>
          <li>7. 장비 구매 검사</li>
          <li>8. 창고 용량 검사</li>
          <li>9. 도감 최고 기록 검사</li>
          <li>10. 화석 수집·소환 검사</li>
          <li>11. 저장·불러오기 검사</li>
          <li>12. 고정 시드 재현 테스트</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
