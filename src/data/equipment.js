// OCEAN GAIA V3.2 — 장비 데이터 (작살 24 / 산소통 6 / 잠수복 6 / 선박 개조 5)
export const SPEARS = [
  { id:'sp01', name:'목재 작살',    rangeM:6,  handling:0.9, stability:0.7, effect:'none',     price:0,    unlock:{ shipLevel:1 } },
  { id:'sp02', name:'무쇠 작살',    rangeM:8,  handling:0.9, stability:0.8, effect:'none',     price:120,  unlock:{ shipLevel:1 } },
  { id:'sp03', name:'갈고리 작살',  rangeM:8,  handling:0.8, stability:0.8, effect:'barbed',   price:220,  unlock:{ shipLevel:1 } },
  { id:'sp04', name:'삼지창',       rangeM:7,  handling:1.0, stability:0.7, effect:'trident',  price:300,  unlock:{ shipLevel:1 } },
  { id:'sp05', name:'용골 작살',    rangeM:10, handling:0.8, stability:0.9, effect:'none',     price:420,  unlock:{ shipLevel:2 } },
  { id:'sp06', name:'전도 작살',    rangeM:9,  handling:0.8, stability:0.8, effect:'electric', price:560,  unlock:{ shipLevel:2 } },
  { id:'sp07', name:'관측 작살',    rangeM:11, handling:0.9, stability:0.9, effect:'mark',     price:640,  unlock:{ shipLevel:2 } },
  { id:'sp08', name:'경량 카본',    rangeM:12, handling:1.2, stability:0.8, effect:'light',    price:780,  unlock:{ shipLevel:2 } },
  { id:'sp09', name:'중추 작살',    rangeM:10, handling:0.6, stability:1.1, effect:'heavy',    price:900,  unlock:{ shipLevel:3 } },
  { id:'sp10', name:'맹그로브 창',  rangeM:12, handling:1.0, stability:0.9, effect:'mud',      price:1050, unlock:{ shipLevel:3 } },
  { id:'sp11', name:'산호 송곳',    rangeM:13, handling:1.0, stability:0.9, effect:'none',     price:1200, unlock:{ shipLevel:3 } },
  { id:'sp12', name:'빙하 쐐기',    rangeM:14, handling:0.9, stability:1.0, effect:'cold',     price:1450, unlock:{ zone:'glacier' } },
  { id:'sp13', name:'화산 창날',    rangeM:14, handling:0.9, stability:1.0, effect:'heat',     price:1550, unlock:{ zone:'volcanic' } },
  { id:'sp14', name:'연직 작살',    rangeM:16, handling:0.8, stability:1.0, effect:'deep',     price:1800, unlock:{ shipLevel:4 } },
  { id:'sp15', name:'심해 탐침',    rangeM:18, handling:0.8, stability:1.1, effect:'sonar',    price:2100, unlock:{ shipLevel:4 } },
  { id:'sp16', name:'폭류 작살',    rangeM:15, handling:1.1, stability:0.9, effect:'current',  price:2300, unlock:{ shipLevel:4 } },
  { id:'sp17', name:'야간 형광창',  rangeM:15, handling:1.0, stability:1.0, effect:'night',    price:2600, unlock:{ shipLevel:4 } },
  { id:'sp18', name:'군집 분산창',  rangeM:16, handling:1.0, stability:1.0, effect:'scatter',  price:2900, unlock:{ shipLevel:4 } },
  { id:'sp19', name:'포획 그물총',  rangeM:13, handling:0.9, stability:1.2, effect:'net',      price:3300, unlock:{ shipLevel:5 } },
  { id:'sp20', name:'난파 인양창',  rangeM:17, handling:0.9, stability:1.1, effect:'salvage',  price:3700, unlock:{ shipLevel:5 } },
  { id:'sp21', name:'뇌문 작살',    rangeM:20, handling:0.7, stability:1.0, effect:'storm',    price:4200, unlock:{ shipLevel:5 } },
  { id:'sp22', name:'진주 바늘',    rangeM:18, handling:1.3, stability:0.9, effect:'pearl',    price:4700, unlock:{ shipLevel:5 } },
  { id:'sp23', name:'가이아 지봉',  rangeM:22, handling:1.0, stability:1.2, effect:'gaia',     price:5600, unlock:{ boss:'dunkleosteus' } },
  { id:'sp24', name:'메갈로 이빨',  rangeM:24, handling:1.1, stability:1.3, effect:'legend',   price:7200, unlock:{ boss:'megalodon' } },
];

export const TANKS = [
  { id:'tk01', name:'기본 공기통',   airCapacity:60,  moveMod:1.0, price:0,    unlock:{ shipLevel:1 } },
  { id:'tk02', name:'예비 탱크',     airCapacity:90,  moveMod:0.95, price:260, unlock:{ shipLevel:2 } },
  { id:'tk03', name:'드라이슈트 연계', airCapacity:120, moveMod:0.95, price:520, unlock:{ shipLevel:3 } },
  { id:'tk04', name:'고압 실린더',   airCapacity:160, moveMod:0.9, price:900,  unlock:{ shipLevel:4 } },
  { id:'tk05', name:'심해 리breather', airCapacity:220, moveMod:0.9, price:1500, unlock:{ shipLevel:4, depth:120 } },
  { id:'tk06', name:'가이아 폐',     airCapacity:300, moveMod:1.0, price:2600, unlock:{ shipLevel:5, depth:200 } },
];

export const SUITS = [
  { id:'st01', name:'면 잠수복',     envMod:0.8, visMod:0.9, moveMod:1.0, maxDepthM:30,  price:0 },
  { id:'st02', name:'열대 슈트',     envMod:1.0, visMod:1.0, moveMod:1.0, maxDepthM:45,  price:200 },
  { id:'st03', name:'내한 슈트',     envMod:1.2, visMod:1.0, moveMod:0.95, maxDepthM:80, price:480 },
  { id:'st04', name:'耐熱 슈트',     envMod:1.3, visMod:0.95, moveMod:0.95, maxDepthM:110, price:820 },
  { id:'st05', name:'심해 압력 슈트', envMod:1.5, visMod:1.2, moveMod:0.9, maxDepthM:200, price:1600 },
  { id:'st06', name:'가이아 외골격', envMod:2.0, visMod:1.5, moveMod:1.1, maxDepthM:300, price:3200 },
];

export const SHIP_UPGRADES = [
  { level:1, name:'낡은 어선',     maxSpeedMs:6,  holdKg:80,  survey:1, price:0,    unlock:null },
  { level:2, name:'근해 목선',     maxSpeedMs:8,  holdKg:160, survey:2, price:600,  unlock:{ shells:400 } },
  { level:3, name:'철골 트롤러',   maxSpeedMs:11, holdKg:300, survey:3, price:1500, unlock:{ shells:1200 } },
  { level:4, name:'탐사 모선',     maxSpeedMs:14, holdKg:520, survey:4, price:3200, unlock:{ shells:2600, zones:3 } },
  { level:5, name:'전설의 가이아호', maxSpeedMs:18, holdKg:850, survey:5, price:6000, unlock:{ shells:5000, zones:5, boss:1 } },
];

export const SHELL_TO_GOLD = 1; // 기본 화폐 = 조개(shells)
