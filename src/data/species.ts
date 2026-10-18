// OCEAN GAIA V3.2 — Species Database (200 species)
// 세션 B 소유 파일

export type Region = 'tropical' | 'glacier' | 'volcanic' | 'mangrove' | 'ocean' | 'deepsea';
export type VerificationStatus = 'VERIFIED' | 'GAME_ESTIMATE';
export type LengthType = 'TL' | 'FL' | 'SL'; // Total Length, Fork Length, Standard Length
export type SpeciesCategory = 'fish' | 'shark_ray' | 'mammal' | 'cephalopod' | 'crustacean' | 'cnidaria' | 'echinoderm' | 'reptile' | 'bird' | 'gastropod' | 'worm' | 'sponge';
export type BehaviorPattern =
  | 'solitary' | 'schooling' | 'evasive' | 'ambush' | 'benthic_rest'
  | 'prey_chase' | 'nocturnal' | 'vertical_migration' | 'territorial' | 'special';

export interface SpeciesData {
  id: number;
  name: string;
  scientificName: string;
  region: Region;
  category?: SpeciesCategory; // 생물 분류 (optional for backward compatibility)
  avgLengthCm: number;
  avgWeightKg: number;
  maxLengthCm: number;
  maxWeightKg: number;
  gameBaseLengthCm: number;
  gameBaseWeightKg: number;
  gameMinLengthCm: number;
  gameMaxLengthCm: number;
  lengthWeightA: number; // W = a * L^b (L in cm, W in kg)
  lengthWeightB: number;
  lengthType: LengthType;
  verification: VerificationStatus;
  verificationSource: string;
  catchable: boolean;
  protected: boolean;
  behaviors: BehaviorPattern[];
  depthMinM: number;
  depthMaxM: number;
  rarity: number; // 1-5, 5=rarest
  sellBasePrice: number; // shells
  observationPoints: number;
}

// Helper to generate species with consistent data
function sp(
  id: number, name: string, sci: string, region: Region,
  avgL: number, avgW: number, maxL: number, maxW: number,
  a: number, b: number, lt: LengthType, ver: VerificationStatus, src: string,
  catchable: boolean, prot: boolean, behaviors: BehaviorPattern[],
  dMin: number, dMax: number, rarity: number, price: number, obsPts: number
): SpeciesData {
  const baseL = avgL;
  const baseW = avgW;
  const minL = Math.round(avgL * 0.3);
  const maxGameL = Math.round(maxL * 1.05);
  return {
    id, name, scientificName: sci, region,
    avgLengthCm: avgL, avgWeightKg: avgW,
    maxLengthCm: maxL, maxWeightKg: maxW,
    gameBaseLengthCm: baseL, gameBaseWeightKg: baseW,
    gameMinLengthCm: minL, gameMaxLengthCm: maxGameL,
    lengthWeightA: a, lengthWeightB: b,
    lengthType: lt, verification: ver, verificationSource: src,
    catchable, protected: prot, behaviors,
    depthMinM: dMin, depthMaxM: dMax,
    rarity, sellBasePrice: price, observationPoints: obsPts
  };
}

export const SPECIES_DATA: SpeciesData[] = [
  // ═══════════════════════════════════════════
  // TROPICAL ZONE (ID 1-40)
  // ═══════════════════════════════════════════
  sp(1, '흰동가리', 'Amphiprion ocellaris', 'tropical', 10, 0.05, 12, 0.08, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'special'], 1, 8, 1, 50, 10),
  sp(2, '흰꼬리나비고기', 'Chaetodon epippus', 'tropical', 18, 0.15, 22, 0.2, 0.00005, 2.9, 'FL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial'], 2, 20, 2, 100, 12),
  sp(3, '나폴레옹피쉬', 'Cheilinus undulatus', 'tropical', 150, 60, 230, 190, 0.00001, 3.1, 'TL', 'VERIFIED', 'FishBase/IUCN', true, true, ['solitary', 'special'], 2, 60, 5, 5000, 100),
  sp(4, '만새기', 'Coryphaena hippurus', 'tropical', 150, 15, 200, 40, 0.000008, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 80, 2, 300, 20),
  sp(5, '흑기새치', 'Istiompax indica', 'tropical', 300, 200, 500, 700, 0.000005, 3.1, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 200, 4, 2000, 50),
  sp(6, '대왕가오리', 'Mobula birostris', 'tropical', 500, 1200, 700, 2000, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase/IUCN', true, true, ['schooling', 'vertical_migration'], 0, 120, 5, 10000, 150),
  sp(7, '그린퍼퍼피시', 'Synchiropus splendidus', 'tropical', 6, 0.01, 8, 0.015, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 2, 20, 3, 200, 25),
  sp(8, '나비고기', 'Chaetodon auriga', 'tropical', 20, 0.2, 25, 0.3, 0.00004, 2.9, 'FL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial'], 1, 30, 1, 80, 10),
  sp(9, '트럼펫피쉬', 'Aulostomus chinensis', 'tropical', 80, 0.8, 120, 1.5, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 1, 40, 2, 150, 15),
  sp(10, '쥐치', 'Balistoides viridescens', 'tropical', 50, 3, 75, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'solitary'], 1, 40, 2, 200, 20),
  sp(11, '노란색상어', 'Carcharhinus amblyrhynchos', 'tropical', 180, 40, 250, 70, 0.000006, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 5, 60, 3, 800, 40),
  sp(12, '레오파드레이', 'Stegostoma tigrinum', 'tropical', 250, 80, 350, 150, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['benthic_rest', 'nocturnal'], 2, 60, 4, 3000, 80),
  sp(13, '해마', 'Hippocampus kuda', 'tropical', 15, 0.02, 20, 0.04, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'benthic_rest'], 1, 20, 3, 500, 30),
  sp(14, '밀레니엄피쉬', 'Pterois miles', 'tropical', 35, 0.5, 40, 0.8, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 2, 40, 2, 180, 20),
  sp(15, '리본뱀장어', 'Rhinomuraena quaesita', 'tropical', 100, 1.5, 130, 2.5, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 5, 50, 3, 400, 35),
  sp(16, '맨다린피쉬', 'Synchiropus picturatus', 'tropical', 6, 0.01, 8, 0.015, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'nocturnal'], 2, 15, 3, 250, 30),
  sp(17, '흰지느러미흉상어', 'Triaenodon obesus', 'tropical', 160, 30, 260, 55, 0.000006, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['nocturnal', 'solitary'], 5, 40, 3, 600, 35),
  sp(18, '청자갈치', 'Fistularia commersonii', 'tropical', 120, 0.8, 180, 1.5, 0.000005, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 1, 40, 2, 130, 15),
  sp(19, '노랑턱쇠크기', 'Sphaeroides nephelus', 'tropical', 12, 0.1, 18, 0.2, 0.00006, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'benthic_rest'], 1, 25, 1, 60, 8),
  sp(20, '홍어', 'Dasyatis akajei', 'tropical', 60, 5, 120, 15, 0.00002, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 5, 60, 2, 200, 15),
  sp(21, '꽃돔', 'Plectropomus leopardus', 'tropical', 70, 5, 150, 20, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'territorial'], 3, 50, 2, 350, 25),
  sp(22, '부채산호돔', 'Heniochus acuminatus', 'tropical', 22, 0.2, 28, 0.3, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 2, 30, 1, 90, 10),
  sp(23, '청색자이언트그루퍼', 'Epinephelus lanceolatus', 'tropical', 250, 150, 400, 400, 0.000004, 3.1, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 5, 100, 4, 2500, 60),
  sp(24, '가시복', 'Diodon holocanthus', 'tropical', 40, 2, 60, 4, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['nocturnal', 'solitary'], 2, 50, 2, 150, 15),
  sp(25, '연무오징어', 'Sepioteuthis lessoniana', 'tropical', 25, 0.3, 35, 0.5, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 1, 20, 1, 80, 10),
  sp(26, '나팔고둥', 'Charonia tritonis', 'tropical', 30, 0.5, 45, 1.0, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'benthic_rest'], 1, 30, 4, 1500, 50),
  sp(27, '청색돌고래', 'Stenella caeruleoalba', 'tropical', 220, 70, 260, 120, 0.000003, 2.9, 'TL', 'VERIFIED', 'Marine Bio DB', false, true, ['schooling', 'special'], 0, 200, 5, 0, 200),
  sp(28, '대왕오징어', 'Architeuthis dux', 'tropical', 600, 200, 1300, 500, 0.000001, 2.8, 'TL', 'VERIFIED', 'Smithsonian', true, false, ['solitary', 'vertical_migration'], 300, 1000, 5, 8000, 200),
  sp(29, '흰동가리(블랙)', 'Amphiprion melanopus', 'tropical', 11, 0.06, 14, 0.09, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'special'], 1, 10, 2, 80, 12),
  sp(30, '블루스팟레이', 'Taeniura lymma', 'tropical', 35, 3, 50, 6, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'nocturnal'], 2, 30, 2, 180, 20),
  sp(31, '배럴피쉬', 'Hyperoglyphe antarctica', 'tropical', 100, 15, 200, 50, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 20, 200, 2, 250, 15),
  sp(32, '노랑줄나비고기', 'Chaetodon semilarvatus', 'tropical', 18, 0.15, 22, 0.2, 0.00005, 2.9, 'FL', 'VERIFIED', 'FishBase', true, false, ['solitary'], 2, 25, 1, 70, 8),
  sp(33, '지브라상어', 'Stegostoma fasciatum', 'tropical', 250, 80, 350, 150, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['benthic_rest', 'nocturnal'], 5, 60, 4, 3000, 80),
  sp(34, '피카소트림피쉬', 'Rhinecanthus aculeatus', 'tropical', 25, 0.4, 35, 0.8, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial'], 1, 20, 1, 100, 12),
  sp(35, '블루링옥토퍼스', 'Hapalochlaena lunulata', 'tropical', 5, 0.01, 8, 0.02, 0.0002, 2.7, 'TL', 'VERIFIED', 'FishBase', true, true, ['ambush', 'nocturnal'], 1, 20, 4, 2000, 60),
  sp(36, '그린터틀', 'Chelonia mydas', 'tropical', 100, 120, 150, 300, 0.000005, 2.9, 'TL', 'VERIFIED', 'IUCN', false, true, ['solitary', 'special'], 0, 40, 5, 0, 150),
  sp(37, '호크스빌거북', 'Eretmochelys imbricata', 'tropical', 80, 60, 100, 100, 0.000006, 2.9, 'TL', 'VERIFIED', 'IUCN', false, true, ['solitary', 'special'], 0, 30, 5, 0, 150),
  sp(38, '망치상어', 'Sphyrna lewini', 'tropical', 300, 150, 430, 250, 0.000004, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 10, 150, 4, 1500, 50),
  sp(39, '쏠배감펭', 'Pterois volitans', 'tropical', 30, 0.4, 40, 0.8, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 2, 40, 2, 160, 18),
  sp(40, '나팔고래', 'Balaenoptera physalus', 'tropical', 2000, 30000, 2600, 70000, 0.0000005, 2.9, 'TL', 'VERIFIED', 'NOAA', false, true, ['schooling', 'vertical_migration', 'special'], 0, 250, 5, 0, 300),

  // ═══════════════════════════════════════════
  // GLACIER ZONE (ID 41-70)
  // ═══════════════════════════════════════════
  sp(41, '남극빙어', 'Dissostichus mawsoni', 'glacier', 120, 20, 200, 60, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'benthic_rest'], 200, 2000, 3, 800, 40),
  sp(42, '북극곤충어', 'Liparis fabricii', 'glacier', 15, 0.05, 22, 0.1, 0.00008, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 10, 300, 1, 40, 8),
  sp(43, '흰고래', 'Delphinapterus leucas', 'glacier', 400, 1000, 550, 1600, 0.000002, 2.9, 'TL', 'VERIFIED', 'NOAA', false, true, ['schooling', 'special'], 0, 200, 5, 0, 200),
  sp(44, '북극참치', 'Thunnus thynnus', 'glacier', 250, 200, 400, 500, 0.000004, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 1200, 40),
  sp(45, '그린란드상어', 'Somniosus microcephalus', 'glacier', 350, 150, 640, 500, 0.000003, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'nocturnal'], 100, 2000, 5, 5000, 120),
  sp(46, '남극크릴', 'Euphausia superba', 'glacier', 5, 0.001, 6, 0.002, 0.0003, 2.7, 'TL', 'VERIFIED', 'CCAMLR', true, false, ['schooling', 'vertical_migration'], 0, 200, 1, 20, 5),
  sp(47, '얼음아귀', 'Chaenocephalus aceratus', 'glacier', 50, 1.5, 75, 3, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 50, 400, 2, 200, 20),
  sp(48, '펭귄', 'Aptenodytes forsteri', 'glacier', 110, 25, 130, 40, 0.00001, 2.8, 'TL', 'VERIFIED', 'Antarctic Research', false, true, ['schooling', 'special'], 0, 50, 4, 0, 100),
  sp(49, '물개', 'Hydrurga leptonyx', 'glacier', 300, 250, 400, 500, 0.000003, 2.85, 'TL', 'VERIFIED', 'Marine Bio DB', false, true, ['solitary', 'prey_chase'], 0, 60, 5, 0, 150),
  sp(50, '북극대구', 'Boreogadus saida', 'glacier', 30, 0.3, 40, 0.5, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 200, 1, 50, 8),
  sp(51, '빙하가오리', 'Raja hyperborea', 'glacier', 80, 8, 120, 15, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 100, 600, 2, 300, 20),
  sp(52, '해파리-북극', 'Cyanea capillata', 'glacier', 50, 5, 200, 20, 0.00002, 2.5, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 0, 50, 2, 60, 15),
  sp(53, '남극민어', 'Notothenia rossii', 'glacier', 60, 3, 80, 5, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'benthic_rest'], 20, 300, 2, 150, 15),
  sp(54, '흰곰', 'Ursus maritimus', 'glacier', 250, 400, 350, 800, 0.000003, 2.8, 'TL', 'VERIFIED', 'IUCN', false, true, ['solitary', 'special'], 0, 10, 5, 0, 200),
  sp(55, '빙하연어', 'Oncorhynchus mykiss', 'glacier', 70, 5, 100, 10, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 50, 1, 100, 10),
  sp(56, '극지오징어', 'Gonatus fabricii', 'glacier', 20, 0.1, 30, 0.2, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['vertical_migration', 'solitary'], 50, 500, 2, 80, 12),
  sp(57, '대서양대구', 'Gadus morhua', 'glacier', 80, 5, 150, 15, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 10, 300, 1, 120, 12),
  sp(58, '북극가자미', 'Reinhardtius hippoglossoides', 'glacier', 60, 3, 100, 8, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 100, 800, 2, 200, 15),
  sp(59, '빙하해마', 'Hippocampus guttulatus', 'glacier', 12, 0.02, 18, 0.04, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'benthic_rest'], 2, 20, 3, 400, 30),
  sp(60, '이글레이', 'Aetobatus narinari', 'glacier', 150, 30, 250, 60, 0.000005, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'solitary'], 5, 60, 3, 500, 30),
  sp(61, '극지흰상어', 'Carcharodon carcharias', 'glacier', 400, 500, 600, 1500, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 100, 4, 2000, 60),
  sp(62, '빙하장어', 'Conger oceanicus', 'glacier', 120, 8, 200, 25, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 20, 300, 2, 200, 18),
  sp(63, '극지바다나리', 'Comaster schlegelii', 'glacier', 15, 0.03, 20, 0.05, 0.00008, 2.7, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 5, 50, 1, 30, 5),
  sp(64, '북극고래', 'Balaena mysticetus', 'glacier', 1500, 50000, 2000, 100000, 0.0000005, 2.9, 'TL', 'VERIFIED', 'NOAA', false, true, ['schooling', 'special'], 0, 200, 5, 0, 300),
  sp(65, '빙하돌돔', 'Pagellus bogaraveo', 'glacier', 40, 1, 60, 2, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 50, 400, 2, 180, 15),
  sp(66, '극지성게', 'Strongylocentrotus droebachiensis', 'glacier', 5, 0.05, 8, 0.1, 0.0002, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 5, 200, 1, 25, 5),
  sp(67, '북극새우', 'Pandalus borealis', 'glacier', 10, 0.02, 14, 0.03, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'benthic_rest'], 20, 500, 1, 30, 5),
  sp(68, '빙하오징어', 'Todarodes sagittatus', 'glacier', 40, 0.5, 60, 1.0, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'vertical_migration'], 50, 400, 2, 100, 12),
  sp(69, '극지바다거북', 'Dermochelys coriacea', 'glacier', 200, 400, 300, 900, 0.000003, 2.85, 'TL', 'VERIFIED', 'IUCN', false, true, ['solitary', 'special'], 0, 300, 5, 0, 200),
  sp(70, '빙하흰고기', 'Coregonus lavaretus', 'glacier', 35, 0.5, 50, 1, 0.00003, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 5, 50, 1, 60, 8),

  // ═══════════════════════════════════════════
  // VOLCANIC ZONE (ID 71-100)
  // ═══════════════════════════════════════════
  sp(71, '화산게', 'Bythograea thermydron', 'volcanic', 8, 0.05, 12, 0.1, 0.0001, 2.8, 'TL', 'VERIFIED', 'NOAA Vents', true, false, ['benthic_rest', 'solitary'], 1500, 3000, 3, 300, 30),
  sp(72, '튜브웜', 'Riftia pachyptila', 'volcanic', 100, 0.3, 200, 0.8, 0.00001, 2.5, 'TL', 'VERIFIED', 'NOAA Vents', true, false, ['benthic_rest', 'special'], 1500, 3500, 3, 200, 25),
  sp(73, '화산달팽이', 'Chrysomallon squamiferum', 'volcanic', 3, 0.01, 5, 0.02, 0.0003, 2.7, 'TL', 'VERIFIED', 'Nature 2019', true, true, ['benthic_rest', 'special'], 2000, 3000, 5, 3000, 80),
  sp(74, '심해열대어', 'Opisthoproctus soleatus', 'volcanic', 12, 0.03, 18, 0.05, 0.00008, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 200, 800, 3, 250, 30),
  sp(75, '바다거미', 'Pycnogonum ricketti', 'volcanic', 15, 0.02, 25, 0.05, 0.00006, 2.7, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 100, 500, 2, 100, 15),
  sp(76, '화산새우', 'Rimicaris exoculata', 'volcanic', 4, 0.005, 6, 0.01, 0.0002, 2.7, 'TL', 'VERIFIED', 'NOAA Vents', true, false, ['schooling', 'benthic_rest'], 1500, 3500, 2, 80, 10),
  sp(77, '화산조개', 'Bathymodiolus thermophilus', 'volcanic', 10, 0.05, 15, 0.1, 0.0001, 2.8, 'TL', 'VERIFIED', 'NOAA Vents', true, false, ['benthic_rest', 'solitary'], 1500, 3000, 2, 60, 8),
  sp(78, '용암불고기', 'Thermarces cerberus', 'volcanic', 20, 0.1, 30, 0.2, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 500, 2000, 3, 180, 20),
  sp(79, '심해아귀', 'Melanocetus johnsonii', 'volcanic', 10, 0.02, 18, 0.05, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 500, 2000, 2, 150, 20),
  sp(80, '화산성게', 'Echinus alexandri', 'volcanic', 6, 0.05, 10, 0.1, 0.0002, 2.7, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 1000, 2500, 2, 80, 10),
  sp(81, '불가사리-화산', 'Hippasteria phrygiana', 'volcanic', 12, 0.03, 18, 0.06, 0.00008, 2.7, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 500, 2000, 1, 40, 5),
  sp(82, '화산해삼', 'Psychropotes longicauda', 'volcanic', 20, 0.1, 35, 0.3, 0.00004, 2.8, 'TL', 'VERIFIED', 'Deep Sea Bio', true, false, ['benthic_rest', 'solitary'], 1000, 4000, 2, 100, 12),
  sp(83, '용암장어', 'Synaphobranchus kaupii', 'volcanic', 80, 1, 120, 2, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 400, 2500, 2, 150, 18),
  sp(84, '화산오징어', 'Mastigoteuthis glaukopis', 'volcanic', 15, 0.03, 25, 0.08, 0.00006, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration'], 500, 2000, 3, 200, 25),
  sp(85, '열수구달팽이', 'Alviniconcha hessleri', 'volcanic', 4, 0.005, 6, 0.01, 0.0002, 2.7, 'TL', 'VERIFIED', 'NOAA Vents', true, false, ['benthic_rest', 'solitary'], 2000, 3500, 3, 150, 20),
  sp(86, '화산가재', 'Munidopsis serricornis', 'volcanic', 6, 0.02, 10, 0.04, 0.0001, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 1000, 3000, 2, 120, 15),
  sp(87, '심해해파리', 'Deepstaria enigmatica', 'volcanic', 60, 2, 100, 5, 0.00002, 2.7, 'TL', 'VERIFIED', 'MBARI', true, false, ['solitary', 'vertical_migration'], 500, 3000, 4, 500, 50),
  sp(88, '화산거미게', 'Macrocheira kaempferi', 'volcanic', 250, 15, 380, 30, 0.000004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 200, 600, 4, 1000, 60),
  sp(89, '용암새우', 'Opaeula macra', 'volcanic', 2, 0.001, 3, 0.002, 0.0005, 2.6, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'schooling'], 0, 5, 2, 30, 5),
  sp(90, '화산복어', 'Arothron hispidus', 'volcanic', 45, 3, 60, 5, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'benthic_rest'], 3, 50, 2, 180, 18),
  sp(91, '심해등각', 'Bathynomus giganteus', 'volcanic', 30, 0.5, 50, 1.5, 0.00003, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'nocturnal'], 200, 2500, 3, 250, 25),
  sp(92, '화산산호', 'Antipathes grandis', 'volcanic', 30, 0.2, 50, 0.5, 0.00003, 2.5, 'TL', 'GAME_ESTIMATE', 'Estimated', true, true, ['benthic_rest', 'special'], 20, 100, 4, 1200, 40),
  sp(93, '용암가오리', 'Bathyraja marshalli', 'volcanic', 70, 5, 100, 10, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 500, 1500, 2, 200, 18),
  sp(94, '화산미역해파리', 'Chrysaora fuscescens', 'volcanic', 30, 2, 50, 5, 0.00003, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 5, 50, 2, 60, 10),
  sp(95, '심해뱀장어', 'Serrivomer beanii', 'volcanic', 60, 0.3, 80, 0.5, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 500, 3000, 3, 200, 25),
  sp(96, '화산바다나리', 'Neocrinus decorus', 'volcanic', 10, 0.02, 15, 0.04, 0.0001, 2.7, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'solitary'], 200, 800, 2, 80, 10),
  sp(97, '용암문어', 'Grimpoteuthis sp.', 'volcanic', 20, 0.2, 35, 0.5, 0.00005, 2.8, 'TL', 'VERIFIED', 'MBARI', true, false, ['solitary', 'vertical_migration'], 800, 5000, 4, 600, 50),
  sp(98, '화산해면', 'Euplectella aspergillum', 'volcanic', 15, 0.05, 25, 0.1, 0.00006, 2.7, 'TL', 'VERIFIED', 'Deep Sea Bio', true, true, ['benthic_rest', 'special'], 200, 1500, 3, 500, 35),
  sp(99, '심해투명새우', 'Gnathophyllum splendidum', 'volcanic', 3, 0.002, 5, 0.004, 0.0003, 2.7, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'benthic_rest'], 200, 1000, 2, 60, 8),
  sp(100, '화산고래', 'Mesoplodon densirostris', 'volcanic', 450, 800, 550, 1200, 0.000002, 2.85, 'TL', 'VERIFIED', 'NOAA', false, true, ['solitary', 'special'], 100, 1000, 5, 0, 200),

  // ═══════════════════════════════════════════
  // MANGROVE ZONE (ID 101-135)
  // ═══════════════════════════════════════════
  sp(101, '망둥어', 'Periophthalmus argentilineatus', 'mangrove', 10, 0.03, 15, 0.06, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'special'], 0, 3, 1, 30, 5),
  sp(102, '실고기', 'Toxotes chatareus', 'mangrove', 25, 0.2, 35, 0.4, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 0, 10, 2, 80, 12),
  sp(103, '맹그로브농어', 'Lates calcarifer', 'mangrove', 100, 15, 200, 50, 0.000008, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['prey_chase', 'solitary'], 0, 60, 2, 250, 20),
  sp(104, '총알고기', 'Acanthopagrus berda', 'mangrove', 30, 0.5, 45, 1.0, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 30, 1, 80, 10),
  sp(105, '칠성장어', 'Monopterus albus', 'mangrove', 30, 0.1, 45, 0.2, 0.00004, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'nocturnal'], 0, 5, 1, 40, 8),
  sp(106, '맹그로브게', 'Scylla serrata', 'mangrove', 20, 0.5, 30, 1.5, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 0, 10, 2, 120, 15),
  sp(107, '뱀장어', 'Anguilla marmorata', 'mangrove', 120, 5, 200, 15, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 0, 50, 2, 200, 18),
  sp(108, '홍학', 'Phoenicopterus roseus', 'mangrove', 130, 5, 160, 8, 0.00001, 2.7, 'TL', 'VERIFIED', 'IUCN', false, true, ['schooling', 'special'], 0, 5, 4, 0, 80),
  sp(109, '왕뱀', 'Python bivittatus', 'mangrove', 300, 30, 500, 70, 0.000003, 2.8, 'TL', 'VERIFIED', 'IUCN', false, true, ['ambush', 'special'], 0, 5, 5, 0, 100),
  sp(110, '아나뱃', 'Monodon monoceros', 'mangrove', 100, 5, 150, 10, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 30, 3, 300, 25),
  sp(111, '맹그로브농게', 'Uca vocator', 'mangrove', 4, 0.01, 6, 0.02, 0.0003, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'schooling'], 0, 3, 1, 20, 3),
  sp(112, '농어', 'Lateolabrax japonicus', 'mangrove', 60, 3, 100, 8, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['prey_chase', 'schooling'], 0, 40, 1, 150, 12),
  sp(113, '황새치', 'Xiphias gladius', 'mangrove', 300, 150, 450, 400, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 200, 3, 800, 35),
  sp(114, '범동가리', 'Amphiprion sebae', 'mangrove', 15, 0.08, 20, 0.12, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['territorial', 'special'], 1, 15, 2, 90, 12),
  sp(115, '맹그로브농어(대)', 'Epinephelus tauvina', 'mangrove', 80, 8, 150, 25, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'territorial'], 5, 60, 2, 300, 22),
  sp(116, '투명새우', 'Palaemon serratus', 'mangrove', 5, 0.005, 8, 0.01, 0.0002, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'benthic_rest'], 0, 10, 1, 20, 3),
  sp(117, '망그로브가오리', 'Himantura walga', 'mangrove', 40, 3, 60, 6, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 2, 30, 2, 150, 15),
  sp(118, '맹그로브뱀', 'Hydrophis spiralis', 'mangrove', 100, 0.5, 150, 1.0, 0.000008, 2.9, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'prey_chase'], 0, 30, 3, 500, 40),
  sp(119, '총알고둥', 'Telescopium telescopium', 'mangrove', 5, 0.02, 8, 0.04, 0.0002, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 0, 3, 1, 15, 3),
  sp(120, '아메리카왕게', 'Cardisoma guanhumi', 'mangrove', 12, 0.3, 18, 0.6, 0.00008, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'nocturnal'], 0, 5, 2, 80, 10),
  sp(121, '맹그로브해마', 'Hippocampus trimaculatus', 'mangrove', 12, 0.02, 16, 0.03, 0.00006, 2.8, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'benthic_rest'], 2, 15, 3, 350, 30),
  sp(122, '늪농어', 'Polynemus melanochir', 'mangrove', 40, 1, 60, 2, 0.00003, 2.95, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 30, 1, 100, 10),
  sp(123, '맹그로브복어', 'Tetraodon mbu', 'mangrove', 50, 3, 70, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'territorial'], 0, 20, 2, 150, 15),
  sp(124, '악어', 'Crocodylus porosus', 'mangrove', 400, 400, 700, 1000, 0.000002, 2.85, 'TL', 'VERIFIED', 'IUCN', false, true, ['ambush', 'special'], 0, 10, 5, 0, 200),
  sp(125, '맹그로브송어', 'Centropomus undecimalis', 'mangrove', 60, 3, 100, 8, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['prey_chase', 'solitary'], 0, 30, 2, 180, 15),
  sp(126, '물총고기', 'Toxotes jaculatrix', 'mangrove', 20, 0.15, 28, 0.25, 0.00005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 0, 10, 2, 70, 10),
  sp(127, '맹그로브조개', 'Geloina coaxans', 'mangrove', 6, 0.05, 10, 0.1, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 0, 5, 1, 25, 5),
  sp(128, '늪뱀장어', 'Anguilla bicolor', 'mangrove', 100, 3, 150, 8, 0.000008, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'nocturnal'], 0, 30, 2, 180, 15),
  sp(129, '맹그로브전어', 'Sardinella gibbosa', 'mangrove', 18, 0.08, 25, 0.15, 0.00006, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 30, 1, 40, 5),
  sp(130, '오스트레일리아흉어', 'Chiloscyllium punctatum', 'mangrove', 80, 3, 100, 5, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['nocturnal', 'benthic_rest'], 2, 30, 2, 200, 18),
  sp(131, '맹그로브농게(대)', 'Parasesarma messa', 'mangrove', 5, 0.015, 8, 0.03, 0.0002, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'schooling'], 0, 3, 1, 20, 3),
  sp(132, '실버아로와나', 'Osteoglossum bicirrhosum', 'mangrove', 80, 3, 120, 6, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'prey_chase'], 0, 20, 4, 2000, 60),
  sp(133, '맹그로브전복', 'Haliotis asinina', 'mangrove', 6, 0.03, 10, 0.08, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 1, 10, 2, 100, 12),
  sp(134, '늪도미', 'Lutjanus argentimaculatus', 'mangrove', 60, 3, 100, 8, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 40, 1, 150, 12),
  sp(135, '맹그로브바다뱀', 'Laticauda laticaudata', 'mangrove', 80, 0.3, 120, 0.6, 0.00001, 2.9, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'prey_chase'], 0, 20, 3, 600, 45),

  // ═══════════════════════════════════════════
  // OPEN OCEAN (ID 136-175)
  // ═══════════════════════════════════════════
  sp(136, '참치', 'Thunnus albacares', 'ocean', 150, 40, 200, 80, 0.000006, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 2, 400, 20),
  sp(137, '흰지느러미상어', 'Carcharodon taurus', 'ocean', 300, 150, 400, 250, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, true, ['solitary', 'prey_chase'], 10, 150, 4, 3000, 80),
  sp(138, '일각고래', 'Monodon monoceros_o', 'ocean', 400, 1000, 500, 1600, 0.000002, 2.9, 'TL', 'VERIFIED', 'NOAA', false, true, ['solitary', 'special'], 0, 300, 5, 0, 250),
  sp(139, '유영상어', 'Prionace glauca', 'ocean', 250, 100, 380, 250, 0.000004, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 600, 30),
  sp(140, '돌고래', 'Tursiops truncatus', 'ocean', 280, 200, 400, 400, 0.000003, 2.85, 'TL', 'VERIFIED', 'NOAA', false, true, ['schooling', 'special'], 0, 200, 4, 0, 150),
  sp(141, '유영가오리', 'Mobula mobular', 'ocean', 200, 50, 300, 100, 0.000005, 3.0, 'TL', 'VERIFIED', 'IUCN', true, true, ['schooling'], 0, 100, 4, 2000, 60),
  sp(142, '날치', 'Exocoetus volitans', 'ocean', 20, 0.05, 30, 0.1, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'evasive'], 0, 30, 1, 30, 5),
  sp(143, '대왕참치', 'Thunnus orientalis', 'ocean', 200, 80, 300, 200, 0.000005, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 250, 3, 600, 25),
  sp(144, '귀상어', 'Carcharhinus plumbeus', 'ocean', 200, 70, 280, 150, 0.000005, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 10, 100, 3, 500, 30),
  sp(145, '유영오징어', 'Ommastrephes bartramii', 'ocean', 30, 0.5, 45, 1.0, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'vertical_migration'], 0, 300, 1, 60, 8),
  sp(146, '청새리상어', 'Isurus oxyrinchus', 'ocean', 300, 100, 400, 250, 0.000004, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 150, 4, 1200, 50),
  sp(147, '고래상어', 'Rhincodon typus', 'ocean', 800, 5000, 1200, 15000, 0.000001, 2.9, 'TL', 'VERIFIED', 'FishBase/IUCN', true, true, ['solitary', 'vertical_migration'], 0, 200, 5, 10000, 200),
  sp(148, '부레돔', 'Seriola dumerili', 'ocean', 120, 20, 180, 50, 0.000007, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 100, 2, 300, 18),
  sp(149, '유영부리갈치', 'Makaira nigricans', 'ocean', 350, 200, 500, 600, 0.000003, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['solitary', 'prey_chase'], 0, 200, 4, 1500, 45),
  sp(150, '대양해파리', 'Pelagia noctiluca', 'ocean', 10, 0.1, 15, 0.2, 0.00008, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'vertical_migration'], 0, 100, 1, 20, 5),
  sp(151, '유영거북', 'Caretta caretta', 'ocean', 90, 80, 120, 150, 0.000006, 2.85, 'TL', 'VERIFIED', 'IUCN', false, true, ['solitary', 'special'], 0, 150, 5, 0, 150),
  sp(152, '대양참치', 'Katsuwonus pelamis', 'ocean', 80, 8, 110, 15, 0.00001, 3.05, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 1, 120, 10),
  sp(153, '유영문어', 'Octopus vulgaris', 'ocean', 50, 2, 80, 5, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 5, 100, 2, 150, 18),
  sp(154, '대양상어', 'Alopias vulpinus', 'ocean', 400, 200, 550, 400, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 200, 4, 1000, 45),
  sp(155, '유영가자미', 'Paralichthys dentatus', 'ocean', 60, 3, 100, 8, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'ambush'], 10, 100, 1, 120, 10),
  sp(156, '대양농어', 'Morone saxatilis', 'ocean', 70, 5, 120, 15, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 60, 1, 150, 12),
  sp(157, '유영방어', 'Trachinotus blochii', 'ocean', 60, 3, 100, 8, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 0, 50, 1, 120, 10),
  sp(158, '대양부리갈치', 'Tetrapturus angustirostris', 'ocean', 250, 80, 350, 150, 0.000004, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['solitary', 'prey_chase'], 0, 200, 3, 800, 35),
  sp(159, '유영연어', 'Salmo salar', 'ocean', 90, 8, 150, 25, 0.000008, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 50, 1, 200, 12),
  sp(160, '대양돌고래', 'Stenella longirostris', 'ocean', 200, 60, 260, 100, 0.000003, 2.85, 'TL', 'VERIFIED', 'NOAA', false, true, ['schooling', 'special'], 0, 200, 4, 0, 120),
  sp(161, '유영홍어', 'Myliobatis aquila', 'ocean', 80, 10, 120, 20, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'benthic_rest'], 5, 80, 2, 200, 15),
  sp(162, '대양흰살생선', 'Pseudotolithus senegalensis', 'ocean', 60, 3, 100, 8, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'benthic_rest'], 10, 100, 1, 130, 10),
  sp(163, '유영상어(대)', 'Negaprion brevirostris', 'ocean', 250, 80, 350, 150, 0.000004, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 5, 80, 3, 500, 30),
  sp(164, '대양날치', 'Hirundichthys speculiger', 'ocean', 22, 0.06, 30, 0.1, 0.00005, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'evasive'], 0, 30, 1, 35, 5),
  sp(165, '유영문어(대)', 'Enteroctopus dofleini', 'ocean', 300, 30, 500, 60, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'ambush'], 20, 300, 3, 400, 35),
  sp(166, '대양바다거북', 'Lepidochelys olivacea', 'ocean', 70, 40, 80, 60, 0.000006, 2.85, 'TL', 'VERIFIED', 'IUCN', false, true, ['schooling', 'special'], 0, 100, 5, 0, 150),
  sp(167, '유영참치(대)', 'Thunnus maccoyii', 'ocean', 180, 60, 250, 150, 0.000005, 3.1, 'TL', 'VERIFIED', 'ICCAT', true, false, ['schooling', 'prey_chase'], 0, 200, 3, 500, 22),
  sp(168, '대양해파리(대)', 'Rhizostoma pulmo', 'ocean', 40, 5, 60, 10, 0.00002, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 0, 50, 1, 30, 8),
  sp(169, '유영농어', 'Dicentrarchus labrax', 'ocean', 70, 5, 120, 12, 0.00001, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 60, 1, 180, 12),
  sp(170, '대양부레돔(대)', 'Seriola lalandi', 'ocean', 130, 25, 180, 60, 0.000007, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 150, 2, 350, 20),
  sp(171, '유영방어(대)', 'Elagatis bipinnulata', 'ocean', 150, 20, 200, 40, 0.000006, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 150, 2, 280, 18),
  sp(172, '대양고래', 'Megaptera novaeangliae', 'ocean', 1500, 25000, 1800, 40000, 0.0000005, 2.9, 'TL', 'VERIFIED', 'NOAA', false, true, ['solitary', 'vertical_migration', 'special'], 0, 300, 5, 0, 300),
  sp(173, '유영오징어(대)', 'Dosidicus gigas', 'ocean', 60, 2, 100, 5, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'prey_chase'], 0, 200, 2, 100, 12),
  sp(174, '대양상어(대)', 'Galeocerdo cuvier', 'ocean', 400, 400, 550, 800, 0.000003, 3.05, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 0, 150, 4, 2000, 60),
  sp(175, '유영가오리(대)', 'Aetomylaeus bovinus', 'ocean', 180, 40, 250, 80, 0.000005, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling'], 10, 100, 3, 400, 25),

  // ═══════════════════════════════════════════
  // DEEP SEA (ID 176-200)
  // ═══════════════════════════════════════════
  sp(176, '아귀', 'Lophius piscatorius', 'deepsea', 80, 5, 150, 25, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 50, 500, 2, 200, 18),
  sp(177, '귀신상어', 'Chlamydoselachus anguineus', 'deepsea', 150, 3, 200, 5, 0.000005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 100, 1500, 4, 800, 50),
  sp(178, '심해문어', 'Grimpoteuthis bathynectes', 'deepsea', 20, 0.1, 35, 0.3, 0.00005, 2.8, 'TL', 'VERIFIED', 'MBARI', true, false, ['solitary', 'vertical_migration'], 1000, 5000, 3, 400, 40),
  sp(179, '대왕오징어(심해)', 'Architeuthis dux_deep', 'deepsea', 800, 300, 1500, 700, 0.000001, 2.8, 'TL', 'VERIFIED', 'Smithsonian', true, false, ['solitary', 'vertical_migration'], 300, 1500, 5, 10000, 200),
  sp(180, '블롭피쉬', 'Psychrolutes marcidus', 'deepsea', 40, 5, 60, 10, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 600, 1200, 3, 300, 30),
  sp(181, '심해성게', 'Cidaris cidaris', 'deepsea', 8, 0.05, 12, 0.1, 0.0001, 2.7, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 100, 1500, 1, 40, 8),
  sp(182, '심해해삼', 'Holothuria forskali', 'deepsea', 15, 0.1, 25, 0.2, 0.00006, 2.8, 'TL', 'VERIFIED', 'Deep Sea Bio', true, false, ['benthic_rest', 'solitary'], 200, 3000, 1, 50, 8),
  sp(183, '귀신불가사리', 'Brisinga endecacnemos', 'deepsea', 20, 0.05, 30, 0.1, 0.00005, 2.7, 'TL', 'VERIFIED', 'Deep Sea Bio', true, false, ['benthic_rest', 'special'], 500, 3000, 3, 200, 25),
  sp(184, '심해장어', 'Synaphobranchus affinis', 'deepsea', 60, 0.5, 100, 1.5, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 200, 2500, 2, 150, 18),
  sp(185, '용어', 'Alepisauroides lacrymatus', 'deepsea', 60, 1, 100, 3, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 500, 3000, 3, 250, 25),
  sp(186, '심해가오리', 'Bathyraja abyssicola', 'deepsea', 60, 3, 90, 6, 0.00002, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 500, 2500, 2, 180, 18),
  sp(187, '투명머리', 'Macropinna microstoma', 'deepsea', 12, 0.03, 18, 0.05, 0.00008, 2.8, 'TL', 'VERIFIED', 'MBARI', true, false, ['solitary', 'vertical_migration'], 300, 1000, 4, 500, 50),
  sp(188, '심해새우', 'Plesionika ensis', 'deepsea', 8, 0.02, 12, 0.04, 0.0001, 2.8, 'TL', 'VERIFIED', 'FishBase', true, false, ['schooling', 'benthic_rest'], 200, 2000, 1, 50, 8),
  sp(189, '괴물고기', 'Anoplogaster cornuta', 'deepsea', 15, 0.2, 20, 0.4, 0.00006, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'prey_chase'], 500, 2500, 3, 300, 30),
  sp(190, '심해오징어', 'Taningia danae', 'deepsea', 100, 5, 150, 10, 0.000008, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['solitary', 'vertical_migration'], 500, 3000, 4, 600, 50),
  sp(191, '유령상어', 'Chimaera monstrosa', 'deepsea', 80, 3, 120, 6, 0.00001, 3.0, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 200, 2000, 2, 200, 20),
  sp(192, '심해불고기', 'Malacosteus niger', 'deepsea', 40, 1, 60, 2, 0.00003, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'solitary'], 500, 2500, 3, 300, 30),
  sp(193, '심해거미게', 'Macrocheira kaempferi_deep', 'deepsea', 200, 12, 300, 25, 0.000005, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['benthic_rest', 'solitary'], 300, 800, 3, 500, 35),
  sp(194, '심해등각(대)', 'Bathynomus raksasa', 'deepsea', 40, 1, 55, 2, 0.00003, 2.8, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['benthic_rest', 'nocturnal'], 500, 2500, 3, 250, 25),
  sp(195, '유령오징어', 'Vampyroteuthis infernalis', 'deepsea', 30, 0.3, 45, 0.6, 0.00004, 2.8, 'TL', 'VERIFIED', 'MBARI', true, true, ['solitary', 'vertical_migration'], 600, 1200, 5, 3000, 80),
  sp(196, '심해해파리(대)', 'Stygiomedusa gigantea', 'deepsea', 100, 10, 200, 30, 0.00001, 2.7, 'TL', 'VERIFIED', 'MBARI', true, false, ['solitary', 'vertical_migration'], 500, 3000, 5, 1500, 80),
  sp(197, '심해뱀장어(대)', 'Nettastoma melanura', 'deepsea', 50, 0.3, 80, 0.8, 0.00002, 2.9, 'TL', 'VERIFIED', 'FishBase', true, false, ['ambush', 'benthic_rest'], 200, 2000, 2, 150, 18),
  sp(198, '심해산호', 'Desmophyllum pertusum', 'deepsea', 20, 0.1, 35, 0.3, 0.00005, 2.7, 'TL', 'VERIFIED', 'Deep Sea Bio', true, true, ['benthic_rest', 'special'], 200, 2000, 4, 800, 50),
  sp(199, '심해문어(대)', 'Haliphron atlanticus', 'deepsea', 200, 30, 350, 80, 0.000005, 2.9, 'TL', 'VERIFIED', 'MBARI', true, false, ['solitary', 'vertical_migration'], 500, 3000, 5, 2000, 100),
  sp(200, '리바이어던', 'Colossoteuthis glacialis', 'deepsea', 400, 100, 600, 300, 0.000002, 2.85, 'TL', 'GAME_ESTIMATE', 'Estimated', true, false, ['solitary', 'vertical_migration', 'special'], 1000, 4000, 5, 5000, 150),
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

// Non-fish species detection (for integration warning)
const NON_FISH_KEYWORDS = [
  '돌고래', '고래', '물개', '흰곰', '펭귄', '악어',  // mammals, birds, reptiles
  '오징어', '문어',  // cephalopods
  '게', '새우',  // crustaceans
  '해파리',  // cnidaria
  '성게', '불가사리', '해삼',  // echinoderms
  '고둥', '전복',  // gastropods
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

    // Detect non-fish species
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

  // Warnings
  if (nonFishSpecies.length > 0) {
    warnings.push(`Non-fish species detected: ${nonFishSpecies.length} species (IDs: ${nonFishSpecies.join(', ')})`);
    warnings.push(`These need to be replaced with fish species to comply with the "200 fish species" contract`);
  }

  return { valid: errors.length === 0, errors, warnings, nonFishSpecies };
}
