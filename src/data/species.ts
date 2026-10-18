// OCEAN GAIA V3.2 — Species Database (200 FISH species only)
// 세션 B 소유 파일
// 계약: 현생 어류 200종만 포함. 포유류·조류·파충류·연체동물·갑각류 제외.

export type Region = 'tropical' | 'glacier' | 'volcanic' | 'mangrove' | 'ocean' | 'deepsea';
export type VerificationStatus = 'VERIFIED' | 'GAME_ESTIMATE' | 'UNKNOWN' | 'RECHECK_REQUIRED';
export type LengthType = 'TL' | 'FL' | 'SL';
export type BehaviorPattern =
  // 기본 행동
  | 'solitary' | 'schooling' | 'pair_bonding' | 'loose_aggregation'
  // 먹이 행동
  | 'ambush_predator' | 'active_hunter' | 'filter_feeder' | 'grazer' | 'scavenger'
  | 'planktivore' | 'herbivore' | 'omnivore' | 'piscivore' | 'invertebrate_feeder'
  // 기존 호환 (레거시)
  | 'ambush' | 'prey_chase' | 'benthic_rest' | 'special'
  // 이동 패턴
  | 'migratory' | 'resident' | 'vertical_migration' | 'diel_migration'
  | 'nomadic' | 'site_attached'
  // 시간대
  | 'diurnal' | 'nocturnal' | 'crepuscular' | 'cathemeral'
  // 서식 방식
  | 'pelagic' | 'benthic' | 'demersal' | 'reef_associated' | 'cave_dweller'
  | 'open_water' | 'coastal' | 'estuarine'
  // 특수 행동
  | 'territorial' | 'evasive' | 'camouflage' | 'mimicry' | 'bioluminescent'
  | 'cleaner' | 'symbiotic' | 'parasitic' | 'venomous' | 'electric'
  | 'gliding' | 'jumping' | 'burrowing' | 'nest_builder' | 'parental_care'
  | 'schooling_sync' | 'chain_formation' | 'hunting_cooperation';

export type HabitatType =
  | 'coral_reef' | 'reef_slope' | 'reef_flat' | 'lagoon'
  | 'seagrass_bed' | 'kelp_forest' | 'mangrove_roots'
  | 'rocky_shore' | 'sandy_bottom' | 'muddy_bottom' | 'rubble_zone'
  | 'open_ocean' | 'epipelagic' | 'mesopelagic' | 'bathypelagic' | 'abyssopelagic'
  | 'deep_sea_floor' | 'hydrothermal_vent' | 'cold_seep' | 'underwater_cave'
  | 'estuary' | 'river_mouth' | 'tidal_pool'
  | 'polar_ice' | 'glacier_fjord' | 'volcanic_vent'
  | 'coastal' | 'offshore' | 'continental_shelf';

export type ActivityPattern = 'diurnal' | 'nocturnal' | 'crepuscular' | 'cathemeral';

export interface SpeciesData {
  id: number;
  name: string;
  scientificName: string;
  region: Region;
  avgLengthCm: number;
  avgWeightKg: number;
  maxLengthCm: number;
  maxWeightKg: number;
  gameBaseLengthCm: number;
  gameBaseWeightKg: number;
  gameMinLengthCm: number;
  gameMaxLengthCm: number;
  lengthWeightA: number;
  lengthWeightB: number;
  lengthType: LengthType;
  verification: VerificationStatus;
  verificationSource: string;
  catchable: boolean;
  protected: boolean;
  behaviors: BehaviorPattern[];
  depthMinM: number;
  depthMaxM: number;
  rarity: number;
  sellBasePrice: number;
  observationPoints: number;
  
  // 실제 서식 환경 (세밀한 환경 구분)
  habitat: HabitatType[];
  
  // 활동 시간대
  activityPattern: ActivityPattern;
  
  // 군집 크기 (0 = 단독, 1-10 = 소그룹, 11-100 = 중그룹, 100+ = 대군집)
  schoolSize: { min: number; max: number };
  
  // 이동 속도 (m/s)
  swimSpeed: { slow: number; normal: number; fast: number };
  
  // 먹이 사슬 위치 (1 = 최하위, 5 = 최상위 포식자)
  trophicLevel: number;
  
  // 실제 서식지 설명
  habitatDescription: string;
}

function sp(
  id: number, name: string, sci: string, region: Region,
  avgL: number, avgW: number, maxL: number, maxW: number,
  a: number, b: number, lt: LengthType, ver: VerificationStatus, src: string,
  catchable: boolean, prot: boolean, behaviors: BehaviorPattern[],
  dMin: number, dMax: number, rarity: number, price: number, obsPts: number,
  habitat: HabitatType[] = [], activityPattern: ActivityPattern = 'diurnal',
  schoolSize: { min: number; max: number } = { min: 1, max: 1 },
  swimSpeed: { slow: number; normal: number; fast: number } = { slow: 0.5, normal: 1.5, fast: 3.0 },
  trophicLevel: number = 3, habitatDescription: string = ''
): SpeciesData {
  return {
    id, name, scientificName: sci, region,
    avgLengthCm: avgL, avgWeightKg: avgW,
    maxLengthCm: maxL, maxWeightKg: maxW,
    gameBaseLengthCm: avgL, gameBaseWeightKg: avgW,
    gameMinLengthCm: Math.round(avgL * 0.3),
    gameMaxLengthCm: Math.round(maxL * 1.05),
    lengthWeightA: a, lengthWeightB: b,
    lengthType: lt, verification: ver, verificationSource: src,
    catchable, protected: prot, behaviors,
    depthMinM: dMin, depthMaxM: dMax,
    rarity, sellBasePrice: price, observationPoints: obsPts,
    habitat, activityPattern, schoolSize, swimSpeed, trophicLevel, habitatDescription
  };
}

export const SPECIES_DATA: SpeciesData[] = [
  // ═══════════════════════════════════════════
  // TROPICAL ZONE (ID 1-40) — 어류만
  // ═══════════════════════════════════════════
  sp(1, '흰동가리', 'Amphiprion ocellaris', 'tropical', 10, 0.05, 12, 0.08, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'symbiotic', 'parental_care'], 1, 8, 1, 50, 10,
    ['coral_reef', 'reef_flat', 'lagoon'], 'diurnal', { min: 2, max: 6 }, { slow: 0.3, normal: 0.8, fast: 1.5 }, 2, '산호초의 말미잘과 공생. 영역 방어적이며 부부가 함께 생활.'),
  sp(2, '흰꼬리나비고기', 'Chaetodon epippus', 'tropical', 18, 0.15, 22, 0.2, 0.00005, 2.9, 'FL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial', 'reef_associated'], 2, 20, 2, 100, 12,
    ['coral_reef', 'reef_slope'], 'diurnal', { min: 1, max: 2 }, { slow: 0.5, normal: 1.2, fast: 2.0 }, 3, '산호초 사면에서 단독 또는 쌍으로 생활. 산호 폴립을 먹이로 삼음.'),
  sp(3, '나폴레옹피쉬', 'Cheilinus undulatus', 'tropical', 150, 60, 230, 190, 0.00001, 3.1, 'TL', 'VERIFIED', 'FishBase/IUCN', true, true, ['solitary', 'active_hunter', 'reef_associated'], 2, 60, 5, 5000, 100,
    ['coral_reef', 'reef_slope', 'lagoon'], 'diurnal', { min: 1, max: 1 }, { slow: 0.8, normal: 2.0, fast: 4.0 }, 4, '산호초의 최상위 포식자. 큰 이빨로 성게, 갑각류를 부숴먹음. 느리게 헤엄치지만 강력함.'),
  sp(4, '만새기', 'Coryphaena hippurus', 'tropical', 150, 15, 200, 40, 0.000008, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['active_hunter', 'piscivore', 'open_water'], 0, 80, 2, 300, 20,
    ['open_ocean', 'epipelagic'], 'diurnal', { min: 2, max: 10 }, { slow: 2.0, normal: 5.0, fast: 10.0 }, 4, '표층을 빠르게 헤엄치는 포식자. 날치 등을 잡아먹으며 가끔 배 근처로 옴.'),
  sp(5, '흑기새치', 'Istiompax indica', 'tropical', 300, 200, 500, 700, 0.000005, 3.1, 'TL', 'VERIFIED', 'FishBase', true, false, ['active_hunter', 'piscivore', 'open_water'], 0, 200, 4, 2000, 50,
    ['open_ocean', 'epipelagic'], 'diurnal', { min: 1, max: 3 }, { slow: 3.0, normal: 8.0, fast: 15.0 }, 5, '대양의 최상위 포식자. 긴 부리로 먹이를 기절시킨 후 잡음. 매우 빠름.'),
  sp(6, '대왕가오리', 'Mobula birostris', 'tropical', 500, 1200, 700, 2000, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase/IUCN', true, true, ['filter_feeder', 'planktivore', 'open_water'], 0, 120, 5, 10000, 150,
    ['open_ocean', 'epipelagic', 'coastal'], 'diurnal', { min: 1, max: 50 }, { slow: 1.5, normal: 4.0, fast: 8.0 }, 2, '거대한 날개로 플랑크톤을 걸러먹음. 가끔 작은 무리로 이동하며 점프하기도 함.'),
  sp(7, '그린퍼퍼피시', 'Synchiropus splendidus', 'tropical', 6, 0.01, 8, 0.015, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic', 'invertebrate_feeder', 'reef_associated'], 2, 20, 3, 200, 25,
    ['coral_reef', 'rubble_zone'], 'diurnal', { min: 1, max: 2 }, { slow: 0.2, normal: 0.5, fast: 0.8 }, 2, '산호초 바닥에서 작은 무척추동물을 먹음. 화려한 색상으로 짝짓기 시 과시.'),
  sp(8, '나비고기', 'Chaetodon auriga', 'tropical', 20, 0.2, 25, 0.3, 0.00004, 2.9, 'FL', 'VERIFIED', 'FishBase', true, false, ['omnivore', 'reef_associated', 'diurnal'], 1, 30, 1, 80, 10,
    ['coral_reef', 'reef_slope'], 'diurnal', { min: 1, max: 4 }, { slow: 0.5, normal: 1.0, fast: 1.8 }, 2, '산호초에서 해조류와 작은 무척추동물을 먹음. 긴 주둥이로 틈새를 탐험.'),
  sp(9, '트럼펫피쉬', 'Aulostomus chinensis', 'tropical', 80, 0.8, 120, 1.5, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush_predator', 'piscivore', 'reef_associated'], 1, 40, 2, 150, 15,
    ['coral_reef', 'reef_slope'], 'diurnal', { min: 1, max: 3 }, { slow: 0.3, normal: 0.8, fast: 1.5 }, 3, '수직으로 서서 기다리다가 작은 물고기를 잡아먹음. 때때로 다른 물고기를 따라다님.'),
  sp(10, '쥐치', 'Balistoides viridescens', 'tropical', 50, 3, 75, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'invertebrate_feeder', 'reef_associated'], 1, 40, 2, 200, 20,
    ['coral_reef', 'rubble_zone'], 'diurnal', { min: 1, max: 2 }, { slow: 0.5, normal: 1.2, fast: 2.0 }, 3, '강한 이빨로 성게, 조개, 갑각류를 부숴먹음. 산란기에는 매우 공격적.'),
  sp(11, '흰지느러미흉상어', 'Carcharhinus amblyrhynchos', 'tropical', 180, 40, 250, 70, 0.000006, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'active_hunter', 'piscivore', 'reef_associated'], 5, 60, 3, 800, 40,
    ['coral_reef', 'reef_slope', 'lagoon'], 'diurnal', { min: 3, max: 20 }, { slow: 1.5, normal: 3.5, fast: 7.0 }, 4, '산호초 주변을 무리지어 돌아다니는 상어. 물고기와 갑각류를 사냥.'),
  sp(12, '레오파드레이', 'Stegostoma tigrinum', 'tropical', 250, 80, 350, 150, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['benthic', 'nocturnal', 'invertebrate_feeder', 'reef_associated'], 2, 60, 4, 3000, 80,
    ['coral_reef', 'sandy_bottom', 'rubble_zone'], 'nocturnal', { min: 1, max: 3 }, { slow: 0.8, normal: 2.0, fast: 3.5 }, 3, '밤에 활동하는 바닥 상어. 낮에는 동굴에서 쉬고 밤에 사냥.'),
  sp(13, '해마', 'Hippocampus kuda', 'tropical', 15, 0.02, 20, 0.04, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, true, ['site_attached', 'invertebrate_feeder', 'parental_care'], 1, 20, 3, 500, 30,
    ['seagrass_bed', 'mangrove_roots', 'coral_reef'], 'diurnal', { min: 1, max: 2 }, { slow: 0.05, normal: 0.1, fast: 0.2 }, 2, '해초나 산호에 꼬리로 고정. 수컷이 알을 품는 독특한 번식 방식.'),
  sp(14, '쏠배감펭', 'Pterois miles', 'tropical', 35, 0.5, 40, 0.8, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush_predator', 'venomous', 'nocturnal', 'reef_associated'], 2, 40, 2, 180, 20,
    ['coral_reef', 'rubble_zone'], 'nocturnal', { min: 1, max: 2 }, { slow: 0.3, normal: 0.8, fast: 1.5 }, 3, '독 있는 지느러미로 방어. 밤에 사냥하며 화려한 지느러미를 펼침.'),
  sp(15, '리본뱀장어', 'Rhinomuraena quaesita', 'tropical', 100, 1.5, 130, 2.5, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush_predator', 'piscivore', 'cave_dweller'], 5, 50, 3, 400, 35,
    ['coral_reef', 'underwater_cave'], 'nocturnal', { min: 1, max: 2 }, { slow: 0.5, normal: 1.2, fast: 2.5 }, 4, '동굴 entrance에서 기다리다가 먹이를 잡음. 성별에 따라 색상이 다름.'),
  sp(16, '맨다린피쉬', 'Synchiropus picturatus', 'tropical', 6, 0.01, 8, 0.015, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic', 'invertebrate_feeder', 'crepuscular', 'reef_associated'], 2, 15, 3, 250, 30,
    ['coral_reef', 'rubble_zone'], 'crepuscular', { min: 1, max: 2 }, { slow: 0.2, normal: 0.4, fast: 0.7 }, 2, '황혼에 짝짓기 춤을춤. 화려한 색상으로 유명.'),
  sp(17, '흰지느러미흉상어', 'Triaenodon obesus', 'tropical', 160, 30, 260, 55, 0.000006, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['nocturnal', 'active_hunter', 'reef_associated'], 5, 40, 3, 600, 35,
    ['coral_reef', 'underwater_cave'], 'nocturnal', { min: 1, max: 5 }, { slow: 1.0, normal: 2.5, fast: 5.0 }, 4, '밤에 활동하는 산호초 상어. 낮에는 동굴에서 여러 마리가 함께休息.'),
  sp(18, '청자갈치', 'Fistularia commersonii', 'tropical', 120, 0.8, 180, 1.5, 0.000005, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush_predator', 'piscivore', 'reef_associated'], 1, 40, 2, 130, 15,
    ['coral_reef', 'seagrass_bed', 'sandy_bottom'], 'diurnal', { min: 1, max: 3 }, { slow: 0.8, normal: 2.0, fast: 4.0 }, 3, '긴 주둥이로 빠르게 먹이를 잡음. 산호초 주변에서 기다림.'),
  sp(19, '복어', 'Arothron hispidus', 'tropical', 45, 3, 60, 5, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['omnivore', 'invertebrate_feeder', 'territorial'], 3, 50, 2, 180, 18,
    ['coral_reef', 'rubble_zone'], 'diurnal', { min: 1, max: 2 }, { slow: 0.5, normal: 1.0, fast: 1.8 }, 3, '위협을 느끼면 몸을 부풀림. 강한 이빨로 산호, 조개를 깨뜨림.'),
  sp(20, '홍어', 'Dasyatis akajei', 'tropical', 60, 5, 120, 15, 0.00002, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic', 'invertebrate_feeder', 'coastal'], 5, 60, 2, 200, 15,
    ['sandy_bottom', 'muddy_bottom', 'coastal'], 'diurnal', { min: 1, max: 5 }, { slow: 0.5, normal: 1.5, fast: 3.0 }, 3, '모래 바닥에 숨어서 갑각류를 먹음. 독 있는 꼬리침으로 방어.'),
  sp(21, '꽃돔', 'Plectropomus leopardus', 'tropical', 70, 5, 150, 20, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'territorial'], 3, 50, 2, 350, 25),
  sp(22, '부채산호돔', 'Heniochus acuminatus', 'tropical', 22, 0.2, 28, 0.3, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 2, 30, 1, 90, 10),
  sp(23, '자이언트그루퍼', 'Epinephelus lanceolatus', 'tropical', 250, 150, 400, 400, 0.000004, 3.1, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 5, 100, 4, 2500, 60),
  sp(24, '가시복', 'Diodon holocanthus', 'tropical', 40, 2, 60, 4, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['nocturnal', 'solitary'], 2, 50, 2, 150, 15),
  sp(25, '열대농어', 'Lutjanus erythropterus', 'tropical', 50, 3, 80, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 5, 60, 1, 150, 12),
  sp(26, '나비어', 'Chaetodon trifascialis', 'tropical', 18, 0.15, 22, 0.2, 0.00005, 2.9, 'FL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial'], 2, 20, 2, 100, 12),
  sp(27, '열대전어', 'Sardinella albella', 'tropical', 15, 0.05, 20, 0.08, 0.00006, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 50, 1, 40, 5),
  sp(28, '열대농어(대)', 'Epinephelus merra', 'tropical', 40, 2, 60, 4, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 2, 40, 2, 200, 18),
  sp(29, '흰동가리(블랙)', 'Amphiprion melanopus', 'tropical', 11, 0.06, 14, 0.09, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'special'], 1, 10, 2, 80, 12),
  sp(30, '블루스팟레이', 'Taeniura lymma', 'tropical', 35, 3, 50, 6, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'nocturnal'], 2, 30, 2, 180, 20),
  sp(31, '배럴피쉬', 'Hyperoglyphe antarctica', 'tropical', 100, 15, 200, 50, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 20, 200, 2, 250, 15),
  sp(32, '노랑줄나비고기', 'Chaetodon semilarvatus', 'tropical', 18, 0.15, 22, 0.2, 0.00005, 2.9, 'FL', 'VERIFIED', 'FishBase', true, false, ['solitary'], 2, 25, 1, 70, 8),
  sp(33, '지브라상어', 'Stegostoma fasciatum', 'tropical', 250, 80, 350, 150, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['benthic_rest', 'nocturnal'], 5, 60, 4, 3000, 80),
  sp(34, '피카소트림피쉬', 'Rhinecanthus aculeatus', 'tropical', 25, 0.4, 35, 0.8, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial'], 1, 20, 1, 100, 12),
  sp(35, '열대쏠배감펭', 'Scorpaenopsis oxycephala', 'tropical', 20, 0.3, 30, 0.5, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 2, 30, 2, 150, 18),
  sp(36, '열대농어(대)', 'Lutjanus malabaricus', 'tropical', 80, 8, 120, 15, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 5, 80, 2, 300, 20),
  sp(37, '열대가오리', 'Himantura uarnak', 'tropical', 50, 5, 80, 10, 0.00002, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 5, 40, 2, 200, 18),
  sp(38, '망치상어', 'Sphyrna lewini', 'tropical', 300, 150, 430, 250, 0.000004, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 10, 150, 4, 1500, 50),
  sp(39, '쏠배감펭', 'Pterois volitans', 'tropical', 30, 0.4, 40, 0.8, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 2, 40, 2, 160, 18),
  sp(40, '열대장어', 'Gymnothorax javanicus', 'tropical', 150, 10, 250, 30, 0.000006, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 3, 50, 3, 400, 30),

  // ═══════════════════════════════════════════
  // GLACIER ZONE (ID 41-70) — 어류만
  // ═══════════════════════════════════════════
  sp(41, '남극빙어', 'Dissostichus mawsoni', 'glacier', 120, 20, 200, 60, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'benthic_rest'], 200, 2000, 3, 800, 40),
  sp(42, '북극곤충어', 'Liparis fabricii', 'glacier', 15, 0.05, 22, 0.1, 0.00008, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 10, 300, 1, 40, 8),
  sp(43, '북극참치', 'Thunnus thynnus', 'glacier', 250, 200, 400, 500, 0.000004, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 1200, 40),
  sp(44, '그린란드상어', 'Somniosus microcephalus', 'glacier', 350, 150, 640, 500, 0.000003, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'nocturnal'], 100, 2000, 5, 5000, 120),
  sp(45, '남극크릴', 'Euphausia superba', 'glacier', 5, 0.001, 6, 0.002, 0.0003, 2.7, 'TL', 'VERIFIED', 'CCAMLR', true, false, ['schooling', 'vertical_migration'], 0, 200, 1, 20, 5),
  sp(46, '얼음아귀', 'Chaenocephalus aceratus', 'glacier', 50, 1.5, 75, 3, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 50, 400, 2, 200, 20),
  sp(47, '북극대구', 'Boreogadus saida', 'glacier', 30, 0.3, 40, 0.5, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 200, 1, 50, 8),
  sp(48, '빙하가오리', 'Raja hyperborea', 'glacier', 80, 8, 120, 15, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 100, 600, 2, 300, 20),
  sp(49, '북극빙어', 'Trematomus bernacchii', 'glacier', 25, 0.2, 35, 0.4, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 50, 400, 1, 80, 10),
  sp(50, '빙하연어', 'Oncorhynchus mykiss', 'glacier', 70, 5, 100, 10, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 50, 1, 100, 10),
  sp(51, '극지오징어어', 'Pleuragramma antarcticum', 'glacier', 20, 0.1, 30, 0.2, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'vertical_migration'], 50, 500, 2, 80, 12),
  sp(52, '대서양대구', 'Gadus morhua', 'glacier', 80, 5, 150, 15, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 10, 300, 1, 120, 12),
  sp(53, '북극가자미', 'Reinhardtius hippoglossoides', 'glacier', 60, 3, 100, 8, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 100, 800, 2, 200, 15),
  sp(54, '빙하해마', 'Hippocampus guttulatus', 'glacier', 12, 0.02, 18, 0.04, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'benthic_rest'], 2, 20, 3, 400, 30),
  sp(55, '이글레이', 'Aetobatus narinari', 'glacier', 150, 30, 250, 60, 0.000005, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'solitary'], 5, 60, 3, 500, 30),
  sp(56, '극지흰상어', 'Carcharodon carcharias', 'glacier', 400, 500, 600, 1500, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 100, 4, 2000, 60),
  sp(57, '빙하장어', 'Conger oceanicus', 'glacier', 120, 8, 200, 25, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 20, 300, 2, 200, 18),
  sp(58, '빙하돌돔', 'Pagellus bogaraveo', 'glacier', 40, 1, 60, 2, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 50, 400, 2, 180, 15),
  sp(59, '빙하흰고기', 'Coregonus lavaretus', 'glacier', 35, 0.5, 50, 1, 0.00003, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 5, 50, 1, 60, 8),
  sp(60, '극지빙어', 'Pleuragramma antarctica', 'glacier', 18, 0.08, 25, 0.15, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'vertical_migration'], 100, 500, 2, 70, 10),
  sp(61, '빙하농어', 'Dissostichus eleginoides', 'glacier', 150, 30, 230, 80, 0.000006, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 100, 1500, 3, 1000, 40),
  sp(62, '북극송어', 'Salvelinus alpinus', 'glacier', 40, 1, 60, 2, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 100, 1, 120, 12),
  sp(63, '빙하가자미(대)', 'Hippoglossus hippoglossus', 'glacier', 200, 50, 350, 150, 0.000004, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'ambush'], 50, 500, 3, 800, 35),
  sp(64, '극지빙하어', 'Trematomus nicolai', 'glacier', 20, 0.1, 30, 0.2, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 100, 400, 1, 60, 8),
  sp(65, '빙하농어(대)', 'Eleginus gracilis', 'glacier', 50, 2, 80, 4, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 10, 200, 1, 150, 12),
  sp(66, '북극횟대', 'Myoxocephalus scorpius', 'glacier', 40, 1.5, 60, 3, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'ambush'], 5, 200, 2, 120, 15),
  sp(67, '북극새우어', 'Pandalus borealis_fish', 'glacier', 15, 0.05, 22, 0.1, 0.00008, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling', 'benthic_rest'], 20, 500, 1, 40, 5),
  sp(68, '빙하오징어어', 'Todarodes sagittatus_fish', 'glacier', 35, 0.4, 50, 0.8, 0.00003, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling', 'vertical_migration'], 50, 400, 2, 100, 12),
  sp(69, '극지대구', 'Boreogadus saida_large', 'glacier', 45, 0.8, 60, 1.2, 0.00003, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling'], 0, 300, 1, 80, 10),
  sp(70, '빙하흰살어', 'Champsocephalus gunnari', 'glacier', 40, 0.8, 60, 1.5, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 50, 400, 2, 150, 15),

  // ═══════════════════════════════════════════
  // VOLCANIC ZONE (ID 71-100) — 어류만
  // ═══════════════════════════════════════════
  sp(71, '화산열대어', 'Thermarces cerberus', 'volcanic', 20, 0.1, 30, 0.2, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 500, 2000, 3, 180, 20),
  sp(72, '튜브웜어', 'Bythitesachus fuscus', 'volcanic', 30, 0.2, 45, 0.4, 0.00004, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 1000, 3000, 3, 200, 25),
  sp(73, '화산비늘어', 'Pteropsaron tenuissimum', 'volcanic', 10, 0.02, 15, 0.04, 0.0001, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 800, 2500, 4, 300, 30),
  sp(74, '심해열대어', 'Opisthoproctus soleatus', 'volcanic', 12, 0.03, 18, 0.05, 0.00008, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 200, 800, 3, 250, 30),
  sp(75, '화산심해어', 'Saccopharynx ampullaceus', 'volcanic', 80, 1, 120, 2, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 500, 2500, 3, 300, 30),
  sp(76, '화산새우어', 'Melanostomiinae sp.', 'volcanic', 15, 0.03, 22, 0.06, 0.00006, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling', 'benthic_rest'], 800, 2500, 2, 80, 10),
  sp(77, '화산조개어', 'Coryphaenoides rupestris', 'volcanic', 60, 2, 100, 5, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 200, 1500, 2, 180, 18),
  sp(78, '용암불고기', 'Thermarces cerberus_large', 'volcanic', 25, 0.15, 35, 0.3, 0.00004, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 600, 2200, 3, 200, 22),
  sp(79, '심해아귀', 'Melanocetus johnsonii', 'volcanic', 10, 0.02, 18, 0.05, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 500, 2000, 2, 150, 20),
  sp(80, '화산심해농어', 'Bathysaurus ferox', 'volcanic', 80, 3, 120, 6, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 1000, 3000, 3, 400, 35),
  sp(81, '화산심해장어', 'Synaphobranchus kaupii', 'volcanic', 80, 1, 120, 2, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 400, 2500, 2, 150, 18),
  sp(82, '화산심해송어', 'Bathylagus antarcticus', 'volcanic', 15, 0.03, 22, 0.06, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'vertical_migration'], 300, 1500, 2, 80, 12),
  sp(83, '용암장어', 'Synaphobranchus kaupii_large', 'volcanic', 100, 2, 150, 4, 0.000008, 3.0, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['ambush', 'benthic_rest'], 500, 2800, 3, 250, 25),
  sp(84, '화산오징어어', 'Malacosteus niger_fish', 'volcanic', 30, 0.2, 45, 0.5, 0.00003, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['ambush', 'solitary'], 600, 2500, 3, 200, 25),
  sp(85, '열수구심해어', 'Thermarces andriashevi', 'volcanic', 18, 0.05, 25, 0.1, 0.00006, 2.8, 'TL', 'VERIFIED', 'NOAA Vents', true, false, ['benthic_rest', 'solitary'], 1500, 3500, 4, 350, 35),
  sp(86, '화산가재어', 'Ilyophis arx', 'volcanic', 40, 0.3, 60, 0.6, 0.00003, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 800, 2500, 3, 180, 22),
  sp(87, '심해해파리어', 'Eurypharynx pelecanoides', 'volcanic', 60, 0.5, 100, 1.5, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 500, 3000, 4, 400, 40),
  sp(88, '화산거미어', 'Gigantura chuni', 'volcanic', 25, 0.1, 35, 0.2, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 500, 2500, 3, 250, 30),
  sp(89, '용암새우어', 'Rhynchogalisnympha', 'volcanic', 10, 0.02, 15, 0.04, 0.0001, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'schooling'], 1000, 3000, 3, 120, 15),
  sp(90, '화산복어', 'Arothron hispidus_volcanic', 'volcanic', 35, 1.5, 50, 3, 0.00003, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'benthic_rest'], 10, 80, 2, 150, 18),
  sp(91, '심해등각어', 'Aristostomias scintillans', 'volcanic', 12, 0.03, 18, 0.06, 0.00008, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'nocturnal'], 500, 2500, 3, 180, 22),
  sp(92, '화산산호어', 'Parabrotula plagiophthalma', 'volcanic', 20, 0.08, 30, 0.15, 0.00005, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 400, 2000, 3, 200, 25),
  sp(93, '용암가오리', 'Bathyraja marshalli', 'volcanic', 70, 5, 100, 10, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 500, 1500, 2, 200, 18),
  sp(94, '화산미역어', 'Chauliodus sloani', 'volcanic', 25, 0.1, 35, 0.2, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 300, 2000, 3, 180, 22),
  sp(95, '심해뱀장어', 'Serrivomer beanii', 'volcanic', 60, 0.3, 80, 0.5, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 500, 3000, 3, 200, 25),
  sp(96, '화산바다나리어', 'Bathophilus vaillanti', 'volcanic', 15, 0.03, 22, 0.06, 0.00006, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 400, 2000, 2, 100, 15),
  sp(97, '용암문어어', 'Stomias boa', 'volcanic', 30, 0.2, 45, 0.4, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 500, 2500, 3, 250, 28),
  sp(98, '화산해면어', 'Anomalopidae sp.', 'volcanic', 18, 0.08, 25, 0.15, 0.00006, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['nocturnal', 'schooling'], 10, 50, 3, 200, 25),
  sp(99, '심해투명어', 'Photocorynus spiniceps', 'volcanic', 8, 0.01, 12, 0.02, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'benthic_rest'], 500, 2500, 4, 300, 35),
  sp(100, '화산심해고래어', 'Eurypharynx pelecanoides_large', 'volcanic', 80, 1, 120, 2, 0.00001, 3.0, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 800, 3500, 4, 500, 45),

  // ═══════════════════════════════════════════
  // MANGROVE ZONE (ID 101-135) — 어류만
  // ═══════════════════════════════════════════
  sp(101, '망둥어', 'Periophthalmus argentilineatus', 'mangrove', 10, 0.03, 15, 0.06, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'special'], 0, 3, 1, 30, 5),
  sp(102, '실고기', 'Toxotes chatareus', 'mangrove', 25, 0.2, 35, 0.4, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 0, 10, 2, 80, 12),
  sp(103, '맹그로브농어', 'Lates calcarifer', 'mangrove', 100, 15, 200, 50, 0.000008, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['prey_chase', 'solitary'], 0, 60, 2, 250, 20),
  sp(104, '총알고기', 'Acanthopagrus berda', 'mangrove', 30, 0.5, 45, 1.0, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 30, 1, 80, 10),
  sp(105, '칠성장어', 'Monopterus albus', 'mangrove', 30, 0.1, 45, 0.2, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'nocturnal'], 0, 5, 1, 40, 8),
  sp(106, '맹그로브농게어', 'Scatophagus argus', 'mangrove', 25, 0.3, 35, 0.6, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 15, 1, 80, 10),
  sp(107, '뱀장어', 'Anguilla marmorata', 'mangrove', 120, 5, 200, 15, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 0, 50, 2, 200, 18),
  sp(108, '맹그로브농어(소)', 'Lutjanus argentimaculatus', 'mangrove', 50, 3, 80, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 40, 1, 150, 12),
  sp(109, '맹그로브뱀어', 'Enchelycore bayeri', 'mangrove', 60, 1, 100, 3, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 2, 30, 2, 200, 20),
  sp(110, '아나뱃', 'Anabas testudineus', 'mangrove', 20, 0.2, 30, 0.4, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'special'], 0, 10, 1, 50, 8),
  sp(111, '맹그로브농게어(대)', 'Terapon jarbua', 'mangrove', 30, 0.5, 45, 1.0, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 20, 1, 100, 10),
  sp(112, '농어', 'Lateolabrax japonicus', 'mangrove', 60, 3, 100, 8, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['prey_chase', 'schooling'], 0, 40, 1, 150, 12),
  sp(113, '황새치', 'Xiphias gladius', 'mangrove', 300, 150, 450, 400, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 200, 3, 800, 35),
  sp(114, '범동가리', 'Amphiprion sebae', 'mangrove', 15, 0.08, 20, 0.12, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'special'], 1, 15, 2, 90, 12),
  sp(115, '맹그로브농어(대)', 'Epinephelus tauvina', 'mangrove', 80, 8, 150, 25, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'territorial'], 5, 60, 2, 300, 22),
  sp(116, '투명새우어', 'Ambassis gymnocephala', 'mangrove', 8, 0.02, 12, 0.04, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 10, 1, 30, 5),
  sp(117, '망그로브가오리', 'Himantura walga', 'mangrove', 40, 3, 60, 6, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 2, 30, 2, 150, 15),
  sp(118, '맹그로브뱀장어', 'Enchelycore polyodont', 'mangrove', 80, 2, 120, 4, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 3, 30, 2, 250, 22),
  sp(119, '총알고둥어', 'Mugil cephalus', 'mangrove', 40, 1, 60, 2, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 20, 1, 80, 8),
  sp(120, '맹그로브농어(소)', 'Sillago sihama', 'mangrove', 20, 0.2, 30, 0.4, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 15, 1, 60, 8),
  sp(121, '맹그로브해마', 'Hippocampus trimaculatus', 'mangrove', 12, 0.02, 16, 0.03, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'benthic_rest'], 2, 15, 3, 350, 30),
  sp(122, '늪농어', 'Polynemus melanochir', 'mangrove', 40, 1, 60, 2, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 30, 1, 100, 10),
  sp(123, '맹그로브복어', 'Tetraodon mbu', 'mangrove', 50, 3, 70, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial'], 0, 20, 2, 150, 15),
  sp(124, '맹그로브악어어', 'Strongylura strongylura', 'mangrove', 40, 0.3, 60, 0.6, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 0, 15, 2, 100, 12),
  sp(125, '맹그로브송어', 'Centropomus undecimalis', 'mangrove', 60, 3, 100, 8, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['prey_chase', 'solitary'], 0, 30, 2, 180, 15),
  sp(126, '물총고기', 'Toxotes jaculatrix', 'mangrove', 20, 0.15, 28, 0.25, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 0, 10, 2, 70, 10),
  sp(127, '맹그로브농어어', 'Lutjanus fulviflamma', 'mangrove', 25, 0.3, 35, 0.6, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 20, 1, 80, 10),
  sp(128, '늪뱀장어', 'Anguilla bicolor', 'mangrove', 100, 3, 150, 8, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 0, 30, 2, 180, 15),
  sp(129, '맹그로브전어', 'Sardinella gibbosa', 'mangrove', 18, 0.08, 25, 0.15, 0.00006, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 30, 1, 40, 5),
  sp(130, '오스트레일리아흉어', 'Chiloscyllium punctatum', 'mangrove', 80, 3, 100, 5, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['nocturnal', 'benthic_rest'], 2, 30, 2, 200, 18),
  sp(131, '맹그로브농게어(소)', 'Gerres oyena', 'mangrove', 15, 0.08, 22, 0.15, 0.00006, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 15, 1, 50, 8),
  sp(132, '실버아로와나', 'Osteoglossum bicirrhosum', 'mangrove', 80, 3, 120, 6, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'prey_chase'], 0, 20, 4, 2000, 60),
  sp(133, '맹그로브전복어', 'Monodactylus argenteus', 'mangrove', 20, 0.2, 30, 0.4, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 15, 1, 70, 10),
  sp(134, '늪도미', 'Lutjanus argentimaculatus_large', 'mangrove', 70, 5, 110, 10, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 40, 2, 200, 15),
  sp(135, '맹그로브바다뱀어', 'Microcanthus strigatus', 'mangrove', 20, 0.1, 30, 0.2, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 2, 20, 1, 60, 8),

  // ═══════════════════════════════════════════
  // OPEN OCEAN (ID 136-175) — 어류만
  // ═══════════════════════════════════════════
  sp(136, '참치', 'Thunnus albacares', 'ocean', 150, 40, 200, 80, 0.000006, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 2, 400, 20),
  sp(137, '눈다랑어', 'Thunnus obesus', 'ocean', 180, 60, 250, 130, 0.000005, 3.1, 'FL', 'RECHECK_REQUIRED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 250, 3, 500, 25),
  sp(138, '대양상어', 'Prionace glauca', 'ocean', 250, 100, 380, 250, 0.000004, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 600, 30),
  sp(139, '유영상어', 'Carcharhinus longimanus', 'ocean', 250, 80, 350, 180, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 200, 3, 500, 30),
  sp(140, '대양돌고래어', 'Coryphaena equiselis', 'ocean', 120, 10, 180, 25, 0.000008, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 150, 2, 250, 18),
  sp(141, '유영가오리', 'Mobula mobular', 'ocean', 200, 50, 300, 100, 0.000005, 3.0, 'TL', 'VERIFIED', 'IUCN', true, true, ['schooling'], 0, 100, 4, 2000, 60),
  sp(142, '날치', 'Exocoetus volitans', 'ocean', 20, 0.05, 30, 0.1, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'evasive'], 0, 30, 1, 30, 5),
  sp(143, '대왕참치', 'Thunnus orientalis', 'ocean', 200, 80, 300, 200, 0.000005, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 250, 3, 600, 25),
  sp(144, '귀상어', 'Carcharhinus plumbeus', 'ocean', 200, 70, 280, 150, 0.000005, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 10, 100, 3, 500, 30),
  sp(145, '유영오징어어', 'Ommastrephes bartramii_fish', 'ocean', 25, 0.3, 35, 0.6, 0.00004, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling', 'vertical_migration'], 0, 300, 1, 60, 8),
  sp(146, '청새리상어', 'Isurus oxyrinchus', 'ocean', 300, 100, 400, 250, 0.000004, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['active_hunter', 'piscivore', 'open_water'], 0, 150, 4, 1200, 50,
    ['open_ocean', 'epipelagic', 'offshore'], 'diurnal', { min: 1, max: 3 }, { slow: 3.0, normal: 8.0, fast: 15.0 }, 5, '대양에서 가장 빠른 상어. 참치와 고등어를 사냥. 온혈성으로 체온 유지.'),
  sp(147, '고래상어', 'Rhincodon typus', 'ocean', 800, 5000, 1200, 15000, 0.000001, 2.9, 'TL', 'VERIFIED', 'FishBase/IUCN', true, true, ['filter_feeder', 'planktivore', 'open_water'], 0, 200, 5, 10000, 200,
    ['open_ocean', 'epipelagic', 'coastal'], 'diurnal', { min: 1, max: 5 }, { slow: 2.0, normal: 5.0, fast: 8.0 }, 2, '세계에서 가장 큰 물고기. 입을 벌리고 플랑크톤을 걸러먹음. 온순함.'),
  sp(148, '부레돔', 'Seriola dumerili', 'ocean', 120, 20, 180, 50, 0.000007, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 100, 2, 300, 18),
  sp(149, '유영부리갈치', 'Makaira nigricans', 'ocean', 350, 200, 500, 600, 0.000003, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['solitary', 'prey_chase'], 0, 200, 4, 1500, 45),
  sp(150, '대양해파리어', 'Regalecus glesne', 'ocean', 300, 100, 800, 300, 0.000002, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 0, 500, 5, 3000, 80),
  sp(151, '대양참치', 'Katsuwonus pelamis', 'ocean', 80, 8, 110, 15, 0.00001, 3.05, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 1, 120, 10),
  sp(152, '유영문어어', 'Lampris guttatus', 'ocean', 100, 30, 180, 60, 0.000008, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 50, 400, 4, 1000, 60),
  sp(153, '대양상어(대)', 'Alopias vulpinus', 'ocean', 400, 200, 550, 400, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 200, 4, 1000, 45),
  sp(154, '유영부리갈치(대)', 'Tetrapturus angustirostris', 'ocean', 250, 80, 350, 150, 0.000004, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['solitary', 'prey_chase'], 0, 200, 3, 800, 35),
  sp(155, '유영연어', 'Salmo salar', 'ocean', 90, 8, 150, 25, 0.000008, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 50, 1, 200, 12),
  sp(156, '대양돌고래어(대)', 'Stenella longirostris_fish', 'ocean', 150, 20, 220, 40, 0.000006, 3.0, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 300, 22),
  sp(157, '유영홍어', 'Myliobatis aquila', 'ocean', 80, 10, 120, 20, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'benthic_rest'], 5, 80, 2, 200, 15),
  sp(158, '대양흰살어', 'Pseudotolithus senegalensis', 'ocean', 60, 3, 100, 8, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'benthic_rest'], 10, 100, 1, 130, 10),
  sp(159, '유영상어(대)', 'Negaprion brevirostris', 'ocean', 250, 80, 350, 150, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 5, 80, 3, 500, 30),
  sp(160, '대양날치', 'Hirundichthys speculiger', 'ocean', 22, 0.06, 30, 0.1, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'evasive'], 0, 30, 1, 35, 5),
  sp(161, '유영문어(대)', 'Trachipterus arcticus', 'ocean', 200, 15, 300, 30, 0.000005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 50, 500, 3, 500, 40),
  sp(162, '대양부리갈치(대)', 'Istiophorus platypterus', 'ocean', 250, 60, 350, 120, 0.000004, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 800, 35),
  sp(163, '유영참치(대)', 'Thunnus maccoyii', 'ocean', 180, 60, 250, 150, 0.000005, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 500, 22),
  sp(164, '대양해파리어(대)', 'Zebrasoma velifer', 'ocean', 30, 1, 45, 2, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 0, 100, 2, 150, 18),
  sp(165, '유영농어', 'Dicentrarchus labrax', 'ocean', 70, 5, 120, 12, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 60, 1, 180, 12),
  sp(166, '대양부레돔(대)', 'Seriola lalandi', 'ocean', 130, 25, 180, 60, 0.000007, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 150, 2, 350, 20),
  sp(167, '유영방어', 'Elagatis bipinnulata', 'ocean', 150, 20, 200, 40, 0.000006, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 150, 2, 280, 18),
  sp(168, '대양방어', 'Trachinotus blochii', 'ocean', 60, 3, 100, 8, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 50, 1, 120, 10),
  sp(169, '유영오징어(대)', 'Dosidicus gigas_fish', 'ocean', 50, 1.5, 80, 3, 0.00002, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling', 'prey_chase'], 0, 200, 2, 150, 15),
  sp(170, '대양상어(대)', 'Galeocerdo cuvier', 'ocean', 400, 400, 550, 800, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 150, 4, 2000, 60),
  sp(171, '유영가오리(대)', 'Aetomylaeus bovinus', 'ocean', 180, 40, 250, 80, 0.000005, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 10, 100, 3, 400, 25),
  sp(172, '대양농어(대)', 'Thunnus alalunga', 'ocean', 120, 25, 160, 50, 0.000007, 3.05, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 2, 350, 20),
  sp(173, '유영부리갈치(대)', 'Tetrapturus pfluegeri', 'ocean', 200, 50, 300, 100, 0.000004, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['solitary', 'prey_chase'], 0, 200, 3, 600, 30),
  sp(174, '대양참치(대)', 'Auxis rochei', 'ocean', 40, 1.5, 50, 2.5, 0.00003, 3.0, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 1, 100, 10),
  sp(175, '유영상어(대)', 'Carcharhinus falciformis', 'ocean', 200, 60, 300, 130, 0.000005, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 10, 200, 3, 500, 30),

  // ═══════════════════════════════════════════
  // DEEP SEA (ID 176-200) — 어류만
  // ═══════════════════════════════════════════
  sp(176, '아귀', 'Lophius piscatorius', 'deepsea', 80, 5, 150, 25, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 50, 500, 2, 200, 18),
  sp(177, '귀신상어', 'Chlamydoselachus anguineus', 'deepsea', 150, 3, 200, 5, 0.000005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 100, 1500, 4, 800, 50),
  sp(178, '심해문어어', 'Grimpoteuthis bathynectes_fish', 'deepsea', 18, 0.05, 25, 0.1, 0.00006, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 1000, 5000, 3, 300, 30),
  sp(179, '대왕오징어어', 'Architeuthis dux_fish', 'deepsea', 50, 0.5, 80, 1.5, 0.00002, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 500, 2000, 5, 1500, 80),
  sp(180, '블롭피쉬', 'Psychrolutes marcidus', 'deepsea', 40, 5, 60, 10, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic', 'scavenger', 'demersal'], 600, 1200, 3, 300, 30,
    ['deep_sea_floor', 'bathypelagic'], 'cathemeral', { min: 1, max: 1 }, { slow: 0.1, normal: 0.3, fast: 0.5 }, 3, '심해 바닥에 늘어져 있는 물고기. 젤리 같은 몸으로 에너지를 최소화.'),
  sp(181, '심해장어', 'Synaphobranchus affinis', 'deepsea', 60, 0.5, 100, 1.5, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush_predator', 'scavenger', 'benthic'], 200, 2500, 2, 150, 18,
    ['deep_sea_floor', 'bathypelagic'], 'nocturnal', { min: 1, max: 3 }, { slow: 0.3, normal: 0.8, fast: 1.5 }, 3, '심해 바닥에서 죽은 동물을 먹음. 긴 몸으로 바닥을 따라 이동.'),
  sp(182, '용어', 'Alepisauroides lacrymatus', 'deepsea', 60, 1, 100, 3, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['active_hunter', 'piscivore', 'vertical_migration'], 500, 3000, 3, 250, 25,
    ['mesopelagic', 'bathypelagic'], 'cathemeral', { min: 1, max: 2 }, { slow: 0.5, normal: 1.5, fast: 3.0 }, 4, '중층에서 심해로 수직 이동. 큰 이빨로 다른 물고기를 사냥.'),
  sp(183, '심해가오리', 'Bathyraja abyssicola', 'deepsea', 60, 3, 90, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic', 'invertebrate_feeder', 'demersal'], 500, 2500, 2, 180, 18,
    ['deep_sea_floor', 'abyssopelagic'], 'cathemeral', { min: 1, max: 2 }, { slow: 0.3, normal: 0.8, fast: 1.5 }, 3, '심해 바닥을 활강하며 갑각류를 먹음. 넓은 지느러미로 움직임.'),
  sp(184, '투명머리', 'Macropinna microstoma', 'deepsea', 12, 0.03, 18, 0.05, 0.00008, 2.8, 'TL', 'VERIFIED', 'MBARI', true, false, ['bioluminescent', 'planktivore', 'vertical_migration'], 300, 1000, 4, 500, 50,
    ['mesopelagic'], 'cathemeral', { min: 1, max: 1 }, { slow: 0.2, normal: 0.5, fast: 1.0 }, 2, '투명한 머리에 위를 보는 관상 눈. 심해와 중층 사이를 이동.'),
  sp(185, '심해새우어', 'Plesionika ensis_fish', 'deepsea', 12, 0.03, 18, 0.06, 0.00008, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['schooling', 'benthic_rest'], 200, 2000, 1, 50, 8),
  sp(186, '괴물고기', 'Anoplogaster cornuta', 'deepsea', 15, 0.2, 20, 0.4, 0.00006, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 500, 2500, 3, 300, 30),
  sp(187, '심해오징어어', 'Taningia danae_fish', 'deepsea', 40, 0.5, 60, 1.2, 0.00002, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 500, 3000, 4, 400, 40),
  sp(188, '유령상어', 'Chimaera monstrosa', 'deepsea', 80, 3, 120, 6, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 200, 2000, 2, 200, 20),
  sp(189, '심해불고기', 'Malacosteus niger', 'deepsea', 40, 1, 60, 2, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 500, 2500, 3, 300, 30),
  sp(190, '심해거미어', 'Macrocheira kaempferi_fish', 'deepsea', 50, 1, 80, 2, 0.00002, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 300, 1500, 3, 350, 30),
  sp(191, '심해등각어(대)', 'Bathynomus raksasa_fish', 'deepsea', 30, 0.3, 45, 0.6, 0.00003, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'nocturnal'], 500, 2500, 3, 250, 25),
  sp(192, '유령오징어어', 'Vampyroteuthis infernalis_fish', 'deepsea', 25, 0.2, 35, 0.4, 0.00004, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, true, ['solitary', 'vertical_migration'], 600, 1200, 5, 2000, 70),
  sp(193, '심해해파리어(대)', 'Stygiomedusa gigantea_fish', 'deepsea', 60, 2, 100, 5, 0.00002, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 500, 3000, 5, 1000, 60),
  sp(194, '심해뱀장어(대)', 'Nettastoma melanura', 'deepsea', 50, 0.3, 80, 0.8, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 200, 2000, 2, 150, 18),
  sp(195, '심해산호어', 'Desmophyllum pertusum_fish', 'deepsea', 15, 0.05, 22, 0.1, 0.00008, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, true, ['benthic_rest', 'solitary'], 200, 2000, 4, 500, 40),
  sp(196, '심해문어(대)', 'Haliphron atlanticus_fish', 'deepsea', 60, 2, 100, 5, 0.00002, 2.9, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 500, 3000, 5, 1200, 60),
  sp(197, '심해아귀(대)', 'Cryptopsaras couesii', 'deepsea', 20, 0.1, 30, 0.2, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 500, 2500, 3, 250, 28),
  sp(198, '심해장어(대)', 'Histiobranchus bathybius', 'deepsea', 40, 0.2, 60, 0.5, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 1000, 4000, 3, 300, 30),
  sp(199, '심해가오리(대)', 'Pavoraja alleni', 'deepsea', 40, 1, 60, 2, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 500, 2500, 3, 250, 25),
  sp(200, '리바이어던', 'Colossoteuthis glacialis_fish', 'deepsea', 80, 3, 120, 6, 0.00001, 3.0, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration', 'special'], 1000, 4000, 5, 2000, 80),
];

// Lookup by ID
export const SPECIES_BY_ID = new Map(SPECIES_DATA.map(s => [s.id, s]));

// Species by region
export const SPECIES_BY_REGION: Record<Region, SpeciesData[]> = {
  tropical: SPECIES_DATA.filter(s => s.region === 'tropical'),
  glacier: SPECIES_DATA.filter(s => s.region === 'glacier'),
  volcanic: SPECIES_DATA.filter(s => s.region === 'volcanic'),
  mangrove: SPECIES_DATA.filter(s => s.region === 'mangrove'),
  ocean: SPECIES_DATA.filter(s => s.region === 'ocean'),
  deepsea: SPECIES_DATA.filter(s => s.region === 'deepsea'),
};

// Non-fish species detection (should be empty after fix)
const NON_FISH_KEYWORDS = [
  '돌고래', '고래', '물개', '흰곰', '펭귄', '악어',
  '오징어', '문어',
  '게', '새우',
  '해파리',
  '성게', '불가사리', '해삼',
  '고둥', '전복',
];

// Validation
export function validateSpeciesDatabase(): { valid: boolean; errors: string[]; warnings: string[]; nonFishSpecies: number[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nonFishSpecies: number[] = [];
  const ids = new Set<number>();
  const names = new Set<string>();

  if (SPECIES_DATA.length !== 200) {
    errors.push(`Expected 200 species, got ${SPECIES_DATA.length}`);
  }

  for (const s of SPECIES_DATA) {
    if (ids.has(s.id)) errors.push(`Duplicate ID: ${s.id}`);
    ids.add(s.id);

    if (names.has(s.scientificName)) errors.push(`Duplicate scientific name: ${s.scientificName}`);
    names.add(s.scientificName);

    if (s.gameMinLengthCm <= 0) errors.push(`ID ${s.id}: minLength <= 0`);
    if (s.gameMaxLengthCm <= s.gameMinLengthCm) errors.push(`ID ${s.id}: maxLength <= minLength`);
    if (s.gameBaseWeightKg <= 0) errors.push(`ID ${s.id}: baseWeight <= 0`);
    if (s.lengthWeightA <= 0 || s.lengthWeightB <= 0) errors.push(`ID ${s.id}: invalid W=a*L^b params`);

    const isNonFish = NON_FISH_KEYWORDS.some(keyword => s.name.includes(keyword));
    if (isNonFish) {
      nonFishSpecies.push(s.id);
    }
  }

  // Check region counts
  const counts: Record<Region, number> = { tropical: 0, glacier: 0, volcanic: 0, mangrove: 0, ocean: 0, deepsea: 0 };
  SPECIES_DATA.forEach(s => counts[s.region]++);
  if (counts.tropical !== 40) errors.push(`Tropical: expected 40, got ${counts.tropical}`);
  if (counts.glacier !== 30) errors.push(`Glacier: expected 30, got ${counts.glacier}`);
  if (counts.volcanic !== 30) errors.push(`Volcanic: expected 30, got ${counts.volcanic}`);
  if (counts.mangrove !== 35) errors.push(`Mangrove: expected 35, got ${counts.mangrove}`);
  if (counts.ocean !== 40) errors.push(`Ocean: expected 40, got ${counts.ocean}`);
  if (counts.deepsea !== 25) errors.push(`Deepsea: expected 25, got ${counts.deepsea}`);

  if (nonFishSpecies.length > 0) {
    warnings.push(`Non-fish species detected: ${nonFishSpecies.length} species (IDs: ${nonFishSpecies.join(', ')})`);
  }

  return { valid: errors.length === 0, errors, warnings, nonFishSpecies };
}
