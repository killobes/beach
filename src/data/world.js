// SpearPals: Blue Harbor — 월드 데이터: 6해역 경계, 12섬, 동료 3, 보스 3 + 화석 15, 탐사지 24
import { ZONES } from './species.js';

// 월드 4800 x 3200 m. 해역 경계 (x0,z0)-(x1,z1)
export const ZONE_BOUNDS = Object.freeze({
  tropical:   { x0: 400,  z0: 1400, x1: 1800, z1: 2600 },
  mangrove:   { x0: 1800, z0: 1400, x1: 2800, z1: 2600 },
  glacier:    { x0: 400,  z0: 200,  x1: 1800, z1: 1400 },
  volcanic:   { x0: 2800, z0: 200,  x1: 4400, z1: 1400 },
  open_ocean: { x0: 1800, z0: 200,  x1: 2800, z1: 1400 },
  deep_sea:   { x0: 2800, z0: 1400, x1: 4400, z1: 2600 },
});

export function zoneAt(x, z) {
  for (const k of Object.keys(ZONE_BOUNDS)) {
    const b = ZONE_BOUNDS[k];
    if (x >= b.x0 && x < b.x1 && z >= b.z0 && z < b.z1) return k;
  }
  return 'open_ocean';
}

// 12개 섬 (V3 확정). startHarbor = 영구 거점
export const ISLANDS = [
  { id:'isl01', name:'산호항',   x:755,  z:1780, zone:'tropical',   harbor:true,  landing:true },
  { id:'isl02', name:'야자섬',   x:1200, z:2200, zone:'tropical',   harbor:false, landing:true },
  { id:'isl03', name:'나비암초', x:900,  z:1600, zone:'tropical',   harbor:false, landing:true },
  { id:'isl04', name:'동백만',   x:1500, z:2400, zone:'tropical',   harbor:false, landing:true },
  { id:'isl05', name:'짱게벌림', x:2100, z:2100, zone:'mangrove',   harbor:false, landing:true },
  { id:'isl06', name:'갈대도',   x:2500, z:1800, zone:'mangrove',   harbor:false, landing:true },
  { id:'isl07', name:'청록절벽', x:800,  z:900,  zone:'glacier',    harbor:false, landing:true },
  { id:'isl08', name:'유빙항',   x:1300, z:500,  zone:'glacier',    harbor:false, landing:true },
  { id:'isl09', name:'흑연섬',   x:3400, z:900,  zone:'volcanic',   harbor:false, landing:true },
  { id:'isl10', name:'분화구도', x:4000, z:500,  zone:'volcanic',   harbor:false, landing:true },
  { id:'isl11', name:'조류등대', x:2300, z:900,  zone:'open_ocean', harbor:false, landing:true },
  { id:'isl12', name:'심해 관문', x:3600, z:2200, zone:'deep_sea',  harbor:false, landing:true },
];

// 탐사지 24개
export const DIVE_SITES = Array.from({ length: 24 }, (_, i) => {
  const zoneKeys = Object.keys(ZONE_BOUNDS);
  const zone = zoneKeys[i % 6];
  const b = ZONE_BOUNDS[zone];
  const t = (i - (i % 6)) / 6;
  return {
    id: `site_${String(i + 1).padStart(2, '0')}`,
    x: Math.round(b.x0 + ((i * 137) % 100) / 100 * (b.x1 - b.x0)),
    z: Math.round(b.z0 + (((i * 61 + 13) % 100)) / 100 * (b.z1 - b.z0)),
    zone,
    depthRangeM: [ZONES[zone].depthMin, ZONES[zone].depthMax],
    hazard: (i % 5) + 1,
    discovered: false,
  };
});

export const COMPANIONS = [
  { id:'mia',  name:'미아',  bonus:{ type:'survey', value:1 },  recruit:{ quest:'obs_20' },   cost:0 },
  { id:'ari',  name:'아리',  bonus:{ type:'air',    value:20 }, recruit:{ quest:'zone_glacier' }, cost:0 },
  { id:'leo',  name:'레오',  bonus:{ type:'hold',   value:100 }, recruit:{ quest:'boss_dunkleosteus' }, cost:0 },
];

export const BOSSES = [
  { id:'dunkleosteus', name:'둔클레오스테우스', fossils:['f01','f02','f03','f04','f05'] },
  { id:'megalodon',    name:'메갈로돈',        fossils:['f06','f07','f08','f09','f10'] },
  { id:'mosasaurus',   name:'모사사우루스',     fossils:['f11','f12','f13','f14','f15'] },
];

export const FOSSILS = [];
for (const boss of BOSSES) {
  boss.fossils.forEach((fid, idx) => {
    FOSSILS.push({ id: fid, bossId: boss.id, piece: idx + 1, respawnSec: 3600 });
  });
}

export const WEATHER_TYPES = ['clear','cloudy','rain','storm','snow','fog'];
export const SEASONS = ['spring','summer','autumn','winter'];
