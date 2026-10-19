#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OCEAN GAIA V3.2 — 200종 어류 species.ts 생성기
검증 실패 시 nonzero exit + 오류 목록 출력.
"""
import json, sys

# [한글명, 영문명, 학명, substrate, 보고최대cm, 게임기준cm, 희귀도, 보호(0/1)]
TROPICAL = [
["흰동가리","Orange clownfish","Amphiprion ocellaris","CORAL",11,8,"COMMON",0],
["블루탱","Regal tang","Paracanthurus hepatus","CORAL",31,25,"UNCOMMON",0],
["옐로우탱","Yellow tang","Zebrasoma flavescens","CORAL",20,16,"COMMON",0],
["브라운탱","Brown surgeonfish","Acanthurus nigrofuscus","CORAL",21,15,"COMMON",0],
["유니콘피시","Bluespine unicornfish","Naso unicornis","CORAL",90,55,"RARE",0],
["나폴레온피시","Humphead wrasse","Cheilinus undulatus","CORAL",230,150,"EPIC",1],
["레드리프앵무물고기","Redlip parrotfish","Scarus frenatus","CORAL",50,38,"UNCOMMON",0],
["토마토클라운","Tomato clownfish","Amphiprion frenatus","CORAL",12,9,"COMMON",0],
["클락클라운","Clark's anemonefish","Amphiprion clarkii","CORAL",14,10,"COMMON",0],
["새들백클라운","Saddleback anemonefish","Amphiprion polymnus","CORAL",13,10,"COMMON",0],
["퍼플클라운","Purple anemonefish","Amphiprion purpureus","CORAL",12,9,"RARE",1],
["사자물고기","Red lionfish","Pterois volitans","CORAL",38,25,"UNCOMMON",0],
["만다린피쉬","Mandarinfish","Synchiropus splendidus","ROCK",6,4.5,"RARE",0],
["퀸앵젤","Queen angelfish","Holacanthus ciliaris","CORAL",45,33,"RARE",0],
["킹앵젤","King angelfish","Holacanthus passer","CORAL",35,26,"UNCOMMON",0],
["플레임앵젤","Flame angelfish","Centropyge loricula","CORAL",15,11,"UNCOMMON",0],
["코랄뷰티","Coral beauty","Centropyge bispinosa","CORAL",10,7,"COMMON",0],
["여울나비치어","Lineated butterflyfish","Chaetodon lineolatus","CORAL",20,15,"COMMON",0],
["쿠퍼밴드나비치어","Copperband butterflyfish","Chaetodon modestus","CORAL",15,11,"COMMON",0],
["반달나비치어","Moon butterflyfish","Chaetodon lunula","CORAL",20,15,"COMMON",0],
["펜넌트피시","Longfin bannerfish","Heniochus acuminatus","CORAL",25,19,"UNCOMMON",0],
["그린크로미스","Blue-green chromis","Chromis viridis","CORAL",9,7,"COMMON",0],
["도미노댐셀","Domino damselfish","Dascyllus trimaculatus","CORAL",14,10,"COMMON",0],
["바이컬러댐셀","Bicolor damselfish","Stegastes bicolor","CORAL",10,7,"COMMON",0],
["옐로우고etil","Yellowfin goatfish","Mulloidichthys vanicolensis","SAND",30,22,"COMMON",0],
["블레스너퍼","Bluestripe snapper","Lutjanus kasmira","CORAL",40,30,"COMMON",0],
["예로우테일스너퍼","Yellowtail snapper","Ocyurus chrysurus","CORAL",85,55,"RARE",0],
["자이언트그루퍼","Giant grouper","Epinephelus lanceolatus","CORAL",270,180,"LEGENDARY",1],
["코랄하인드","Coral hind","Cephalopholis miniata","CORAL",45,32,"UNCOMMON",0],
["아르구스하인드","Argus grouper","Cephalopholis argus","CORAL",55,38,"UNCOMMON",0],
["크림슨스너퍼","Crimson snapper","Lutjanus erythropterus","CORAL",50,35,"COMMON",0],
["롱핀래빗피시","Longfin rabbitfish","Siganus vermiculatus","CORAL",45,32,"COMMON",0],
["스파이니래빗피시","Spiny rabbitfish","Siganus spinus","CORAL",30,21,"COMMON",0],
["화이트사이드서전","Whiteside surgeon","Acanthurus nigroris","CORAL",35,25,"COMMON",0],
["더스키서전","Twotone surgeon","Acanthurus dussumieri","CORAL",30,22,"COMMON",0],
["오렌지스파인유니콘","Orangespine unicornfish","Naso lituratus","CORAL",45,32,"COMMON",0],
["화이트그런트","White grunt","Haemulon plumierii","CORAL",40,27,"COMMON",0],
["예로우헤드라스","Clown wrasse","Coris aygula","CORAL",40,28,"COMMON",0],
["보라색도미","Coral trout","Variola louti","CORAL",85,55,"UNCOMMON",0],
["예로우잭","Yellow jack","Caranx bartholomaei","OPEN_WATER",85,55,"COMMON",0],
]
GLACIAL = [
["대서양대구","Atlantic cod","Gadus morhua","ROCK",200,110,"RARE",0],
["북극대구","Arctic cod","Boreogadus saida","ICE",40,26,"COMMON",0],
["캐플린","Capelin","Mallotus villosus","OPEN_WATER",24,16,"COMMON",0],
["블루휘팅","Blue whiting","Micromesistius poutassou","OPEN_WATER",50,34,"COMMON",0],
["패타고니아투스피시","Patagonian toothfish","Dissostichus eleginoides","ROCK",210,140,"EPIC",0],
["로스투스피시","Ross toothfish","Notothenia rossii","ROCK",85,55,"UNCOMMON",0],
["니스테디아","Marbled rockcod","Notothenia corlicops","ROCK",90,60,"UNCOMMON",0],
["블랙핀아이스피시","Blackfin icefish","Pagothenia borchgrevinki","ICE",30,20,"COMMON",0],
["챔포세팔루스","Southern ocean cod","Champsocephalus gunnari","OPEN_WATER",55,38,"UNCOMMON",0],
["켈프그린링","Kelp greenling","Hexagrammos decagrammus","KELP",60,40,"UNCOMMON",0],
["알래스카폴록","Walleye pollock","Gadus chalcogrammus","OPEN_WATER",90,60,"COMMON",0],
["태평양청어","Pacific herring","Clupea pallasii","OPEN_WATER",45,30,"COMMON",0],
["참연어","Chinook salmon","Oncorhynchus tshawytscha","OPEN_WATER",150,95,"RARE",0],
["코호연어","Coho salmon","Oncorhynchus kisutch","OPEN_WATER",100,65,"UNCOMMON",0],
["핑크연어","Pink salmon","Oncorhynchus gorischa","OPEN_WATER",70,45,"COMMON",0],
["소키연어","Sockeye salmon","Oncorhynchus nerka","OPEN_WATER",80,52,"UNCOMMON",0],
["브라운송어","Brown trout","Salmo trutta","ROCK",100,60,"UNCOMMON",0],
["북극산char","Arctic char","Salvelinus alpinus","ROCK",80,50,"RARE",0],
["레이크트라우드","Lake trout","Salvelinus namaycush","ROCK",120,75,"RARE",0],
["대서양연어","Atlantic salmon","Salmo salar","OPEN_WATER",150,95,"RARE",0],
["울프피시","Atlantic wolffish","Anarhichas lupus","ROCK",150,95,"UNCOMMON",0],
["럼프피시","Lumpfish","Cyclopterus lumpus","ROCK",60,40,"UNCOMMON",0],
["오션파우트","Ocean pout","Liparis liparis","ROCK",20,13,"COMMON",0],
["롱혼스크얼핀","Longhorn sculpin","Myoxocephalus octodecemspinosus","ROCK",30,20,"COMMON",0],
["그린란드샤크","Greenland shark","Somniosus microcephalus","OPEN_WATER",600,380,"LEGENDARY",1],
["포비걸","Porbeagle","Lamna nasus","OPEN_WATER",250,160,"EPIC",0],
["스피니독피시","Spiny dogfish","Squalus acanthias","ROCK",100,65,"UNCOMMON",0],
["질피시","Sea eelpout","Zoarces viviparus","ROCK",40,27,"COMMON",0],
["대서양할리벗","Atlantic halibut","Hippoglossus hippoglossus","ROCK",300,190,"EPIC",0],
["피코커플렌더","Peacock flounder","Bothus mancus","SAND",45,30,"UNCOMMON",0],
]
VOLCANIC = [
["돌발가물치","Daggertooth pike conger","Muraenesox cinereus","VENT",200,130,"RARE",0],
["그린모레이","Green moray","Gymnothorax funebris","ROCK",250,160,"UNCOMMON",0],
["자이언트모레이","Giant moray","Gymnothorax javanicus","ROCK",300,200,"EPIC",0],
["샌드디버고비","Sand diver goby","Amblygobius stethophthalmus","SAND",15,10,"COMMON",0],
["새커스틱프린지헤드","Sarcastic fringehead","Neoclinus blenninus","ROCK",30,20,"UNCOMMON",0],
["스포트드스콜피나","Spotted scorpionfish","Scorpaena guttata","ROCK",45,30,"COMMON",0],
["레드로크피시","Red rockfish","Sebastes ruberrimus","ROCK",120,80,"RARE",0],
["캐너리로크피시","Canary rockfish","Sebastes pinniger","ROCK",90,60,"UNCOMMON",0],
["버밀리언록피시","Vermillion rockfish","Sebastes miniatus","ROCK",95,62,"UNCOMMON",0],
["블랙록피시","Black rockfish","Sebastes melanops","ROCK",70,48,"COMMON",0],
["블루록피시","Blue rockfish","Sebastes mystinus","ROCK",60,40,"COMMON",0],
["노던스타게이저","Northern stargazer","Astroscopus y-graecum","SAND",70,45,"UNCOMMON",0],
["애틀랜틱토르피도","Atlantic torpedo","Torpedo nobeliana","SAND",120,80,"RARE",0],
["클리어노우스케이트","Clearnose skate","Raja eglanteria","SAND",100,65,"UNCOMMON",0],
["서던스팅레이","Southern stingray","Hypanus americanus","SAND",150,100,"UNCOMMON",0],
["샌드리저드피시","Sand lizardfish","Synodus saurus","SAND",40,26,"COMMON",0],
["발리후","Ballyhoo","Hemiramphus brasiliensis","OPEN_WATER",40,27,"COMMON",0],
["와inged플라이잉피시","Brownwing flyingfish","Hirundichthys planificeps","OPEN_WATER",30,20,"COMMON",0],
["마히마히","Common dolphinfish","Coryphaena hippurus","OPEN_WATER",210,130,"RARE",0],
["세로","Cero","Scomberomorus regalis","OPEN_WATER",100,65,"UNCOMMON",0],
["스페니시매커렐","Spanish mackerel","Scomberomorus maculatus","OPEN_WATER",90,60,"UNCOMMON",0],
["퍼밋","Permit","Trachinotus falcatus","SAND",120,80,"RARE",0],
["버터플라이폼파노","Butterfly pompano","Trachinotus blochii","SAND",70,45,"UNCOMMON",0],
["스누크","Common snook","Centropomus undecimalis","ROCK",130,85,"UNCOMMON",0],
["크레밸잭","Crevalle jack","Caranx hippos","OPEN_WATER",110,70,"COMMON",0],
["블루핀프레빌","Bluefin trevally","Caranx melampygus","OPEN_WATER",115,75,"RARE",0],
["오네이트조피시","Ornate jobfish","Aprion virescens","ROCK",100,65,"UNCOMMON",0],
["애드센션다람쥐치","Squirrelfish","Holocentrus adscensionis","ROCK",30,20,"COMMON",0],
["코러스쿰다람쥐치","Reef squirrelfish","Sargocentron coruscum","CORAL",30,20,"COMMON",0],
["마모레블렌니","Mottled blenny","Parablennius marmoreus","ROCK",15,10,"COMMON",0],
]
MANGROVE = [
["밀렛","Fathead mullet","Mugil cephalus","MUD",100,60,"COMMON",0],
["스트라이프드밀렛","Striped mullet","Mugil curema","MUD",40,26,"COMMON",0],
["스팟","Spot","Leiostomus xanthurus","MUD",35,24,"COMMON",0],
["거프멘헤이든","Gulf menhaden","Brevoortia patronus","MUD",30,20,"COMMON",0],
["십스헤드","Sheepshead","Archosargus probatocephalus","ROCK",75,50,"UNCOMMON",0],
["블랙드럼","Black drum","Pogonias cromis","MUD",160,100,"RARE",0],
["레드드럼","Red drum","Sciaenops ocellatus","MUD",130,85,"UNCOMMON",0],
["스페이디피시","Spadefish","Platax orbicularis","CORAL",60,40,"UNCOMMON",0],
["바라문디","Barramundi","Lates calcarifer","MUD",200,120,"EPIC",0],
["망그루브킬리피시","Mangrove killifish","Kryptolebias marmoratus","MUD",5,3.5,"RARE",0],
["타이드워터모하라","Tidewater mojarra","Eucinostomus gula","MUD",20,14,"COMMON",0],
["실버스 모하라","Silver mojarra","Eucinostomus argenteus","MUD",25,17,"COMMON",0],
["레이디피시","Ladyfish","Elops saurus","MUD",100,65,"UNCOMMON",0],
["타폰","Tarpon","Megalops atlanticus","MUD",250,160,"LEGENDARY",0],
["본피시","Bonefish","Albula vulpes","SAND",90,55,"RARE",0],
["실벌시라고","Silver sillago","Sillago sihama","SAND",30,20,"COMMON",0],
["망그루브잭","Mangrove jack","Lutjanus johnii","ROCK",60,38,"COMMON",0],
["망그루브레드스너퍼","Mangrove red snapper","Lutjanus argentimaculatus","ROCK",120,80,"UNCOMMON",0],
["그레이스너퍼","Gray snapper","Lutjanus griseus","MUD",80,50,"COMMON",0],
["불샤크","Bull shark","Carcharhinus leucas","MUD",350,230,"EPIC",0],
["카우노우스레이","Cownose ray","Rhinoptera bonasus","MUD",160,110,"UNCOMMON",0],
["시가트피시","Sea catfish","Bagre marinus","MUD",90,60,"COMMON",0],
["애틀랜틱크로커","Atlantic croaker","Micropogonias undulatus","MUD",75,50,"COMMON",0],
["위크피시","Weakfish","Cynoscion regalis","MUD",90,60,"UNCOMMON",0],
["스포트드시트라우트","Spotted seatrout","Cynoscion nebulosus","MUD",100,65,"UNCOMMON",0],
["픽피시","Pigfish","Orthopristis chrysoptera","MUD",40,27,"COMMON",0],
["서서아이포지","Saucereye porgy","Calamus calamus","ROCK",45,30,"COMMON",0],
["샌드타일피시","Sand tilefish","Malacanthus plumieri","SAND",45,30,"COMMON",0],
["사가숨피시","Sargassum fish","Histrio histrio","KELP",18,12,"UNCOMMON",0],
["체크드복어","Checkered puffer","Sphoeroides testudineus","MUD",40,26,"UNCOMMON",0],
["노던피프레쉬","Northern puffer","Lagocephalus laevigatus","MUD",45,30,"COMMON",0],
["롱스파인포르큐파인","Long-spine porcupinefish","Diodon holocanthus","MUD",60,40,"UNCOMMON",0],
["포크피시","Porkfish","Anisotremus virginicus","ROCK",40,27,"COMMON",0],
["실버퍼치","Silver perch","Eupercus bifasciatus","MUD",25,17,"COMMON",0],
["나일틸라피아","Nile tilapia","Oreochromis niloticus","MUD",60,38,"COMMON",0],
]
OCEANIC = [
["옐로핀튜나","Yellowfin tuna","Thunnus albacares","OPEN_WATER",240,150,"EPIC",0],
["빅아이튜나","Bigeye tuna","Thunnus obesus","OPEN_WATER",250,160,"EPIC",0],
["블루핀튜나","Atlantic bluefin tuna","Thunnus thynnus","OPEN_WATER",460,300,"LEGENDARY",1],
["알바코어","Albacore","Thunnus alalunga","OPEN_WATER",140,90,"RARE",0],
["스킵잭","Skipjack tuna","Katsuwonus pelamis","OPEN_WATER",110,70,"UNCOMMON",0],
["보니토","Pacific bonito","Sarda orientalis","OPEN_WATER",100,65,"COMMON",0],
["프리게이트맥커렐","Frigate mackerel","Auxis thazard","OPEN_WATER",100,65,"COMMON",0],
["애틀랜맊커렐","Atlantic mackerel","Scomber scombrus","OPEN_WATER",60,40,"COMMON",0],
["럽쿠맥커렐","Chub mackerel","Scomber japonicus","OPEN_WATER",60,40,"COMMON",0],
["왕삼치","King mackerel","Scomberomorus cavalla","OPEN_WATER",180,120,"RARE",0],
["웨후","Wahoo","Acanthocybium solandri","OPEN_WATER",250,160,"EPIC",0],
["블루마린","Blue marlin","Makaira nigricans","OPEN_WATER",430,290,"LEGENDARY",0],
["블랙마린","Black marlin","Istiompax indica","OPEN_WATER",500,330,"LEGENDARY",0],
["새드피시","Sailfish","Istiophorus platypterus","OPEN_WATER",340,220,"EPIC",0],
["스워드피시","Swordfish","Xiphias gladius","OPEN_WATER",450,300,"LEGENDARY",0],
["오파","Opah","Lampris guttatus","OPEN_WATER",210,140,"EPIC",0],
["퍼시픽소주리","Pacific saury","Cololabis saira","OPEN_WATER",40,27,"COMMON",0],
["오션선피시","Ocean sunfish","Mola mola","OPEN_WATER",330,220,"LEGENDARY",1],
["베이싱샤크","Basking shark","Cetorhinus maximus","OPEN_WATER",1000,650,"LEGENDARY",1],
["웨일샤크","Whale shark","Rhincodon typus","OPEN_WATER",1200,800,"LEGENDARY",1],
["SHORTFINMAKO","Shortfin mako","Isurus oxyrinchus","OPEN_WATER",400,260,"EPIC",0],
["실키샤크","Silky shark","Carcharhinus falciformis","OPEN_WATER",330,220,"RARE",0],
["오션화이트팁","Oceanic whitetip","Carcharhinus longimanus","OPEN_WATER",300,200,"EPIC",1],
["블루샤크","Blue shark","Prionace glauca","OPEN_WATER",380,250,"RARE",0],
["타이거샤크","Tiger shark","Galeocerdo cuvier","OPEN_WATER",530,350,"EPIC",0],
["귀상어","Scalloped hammerhead","Sphyrna lewini","OPEN_WATER",430,280,"EPIC",1],
["레몬샤크","Lemon shark","Negaprion brevirostris","SAND",350,230,"RARE",0],
["캐리비언리프샤크","Caribbean reef shark","Carcharhinus perezi","CORAL",300,200,"RARE",0],
["그레이트니들피시","Great needlefish","Belone belone","OPEN_WATER",130,85,"COMMON",0],
["브라마","Pomfret","Brama bruno","OPEN_WATER",100,65,"UNCOMMON",0],
["그레이트엠버재ك","Greater amberjack","Seriola dumerili","OPEN_WATER",180,120,"RARE",0],
["레서엠버재ك","Lesser amberjack","Seriola fasciata","ROCK",70,45,"COMMON",0],
["옐로우테일엠버재ك","Yellowtail amberjack","Seriola lalandi","OPEN_WATER",150,95,"RARE",0],
["자이언트트레밸리","Giant trevally","Caranx ignobilis","OPEN_WATER",170,110,"EPIC",0],
["골든투레밸리","Golden trevally","Gnathanodon speciosus","SAND",120,80,"UNCOMMON",0],
["옐로스트라이프스카드","Yellowstripe scad","Selaroides leptolepis","OPEN_WATER",25,17,"COMMON",0],
["일본전갱이","Japanese horse mackerel","Trachurus japonicus","OPEN_WATER",50,33,"COMMON",0],
["메디테레이션전갱이","Mediterranean horse mackerel","Trachurus mediterraneus","OPEN_WATER",50,33,"COMMON",0],
["유럽정어리","European anchovy","Engraulis encrasicolus","OPEN_WATER",20,13,"COMMON",0],
["유럽가다랑어","European sardine","Sardina pilchardus","OPEN_WATER",27,18,"COMMON",0],
]
ABYSSAL = [
["앙글러피시","Anglerfish","Lophius piscatorius","MUD",200,130,"RARE",0],
["팽투스","Common fangtooth","Anoplogaster cornuta","TRENCH",20,13,"UNCOMMON",0],
["블랙시데빌","Black seadevil","Melanocetus johnsonii","TRENCH",18,12,"RARE",0],
["굴퍼일","Gulper eel","Eurypharynx pelecanoides","TRENCH",100,65,"EPIC",0],
["라운드노스가레나다이어","Roundnose grenadier","Coryphaenoides rupestris","SAND",110,70,"UNCOMMON",0],
["어비셜가레나다이어","Abyssal grenadier","Coryphaenoides armatus","SAND",110,70,"UNCOMMON",0],
["스포티드란턴피시","Spotted lanternfish","Myctophum punctatum","OPEN_WATER",15,10,"COMMON",0],
["워미니란턴피시","Warming's lanternfish","Ceratoscopelus warmingii","OPEN_WATER",10,7,"COMMON",0],
["카를스베르크란턴피시","Soft lanternfish","Electrona carlsbergi","OPEN_WATER",10,7,"COMMON",0],
["슬렌더스나이크일","Slender snipe eel","Nemichthys scolopaceus","TRENCH",130,85,"RARE",0],
["세이버투스피시","Sabertooth fish","Evermannella balbo","TRENCH",30,20,"UNCOMMON",0],
["바로엘아이","Barreleye","Macropinna microstoma","TRENCH",15,10,"RARE",0],
["보니어드애스피시","Bony-eared assfish","Acanthonous sacculus","TRENCH",30,20,"COMMON",0],
["올리브브로툴라","Olive brotula","Brotula multibarbata","TRENCH",40,27,"COMMON",0],
["트리플워트시데빌","Triplewart seadevil","Cryptopsaras couesii","TRENCH",15,10,"RARE",0],
["파고다피시","Pagoda fish","Chaunax endeavouri","MUD",40,27,"UNCOMMON",0],
["오렌지로피","Orange roughy","Hoplostethus atlanticus","ROCK",75,50,"EPIC",1],
["스톱라이트루스조","Stoplight loosejaw","Malacosteus niger","TRENCH",25,17,"RARE",0],
["블랙드래곤스토미아스","Dragonfish","Stomias boa","TRENCH",30,20,"UNCOMMON",0],
["커스크","Cusk","Brosme brosme","ROCK",120,80,"UNCOMMON",0],
["그린란드할리벗","Greenland halibut","Reinhardtius hippoglossoides","SAND",240,150,"RARE",0],
["에스코랄","Escolar","Lepidocybium flavobrunneum","TRENCH",180,120,"EPIC",0],
["오일피시","Oilfish","Ruvettus pretiosus","TRENCH",200,130,"RARE",0],
["딥시깁버피시","Deepsea gibberfish","Gibberichthys latos","TRENCH",30,20,"UNKNOWN",0],
["디아푸스란턴피시","Suborbital lanternfish","Diaphus suborbitalis","OPEN_WATER",9,6,"COMMON",0],
]

ZONES = {
  "tropical": {"depth":[0,35], "temp":[24,30], "rows":TROPICAL},
  "glacial":  {"depth":[0,160], "temp":[-2,8], "rows":GLACIAL},
  "volcanic": {"depth":[0,120], "temp":[18,42], "rows":VOLCANIC},
  "mangrove": {"depth":[2,30], "temp":[22,32], "rows":MANGROVE},
  "oceanic":  {"depth":[10,120], "temp":[12,28], "rows":OCEANIC},
  "abyssal":  {"depth":[60,300], "temp":[2,12], "rows":ABYSSAL},
}
EXPECT = {"tropical":40,"glacial":30,"volcanic":30,"mangrove":35,"oceanic":40,"abyssal":25}
FORBIDDEN = ["squid","octopus","snail","crab","lobster","shrimp","dolphin ","turtle","jellyfish","starfish","scallop fish","mussel","oyster","cuttlefish","nautilus","krill","barnacle","urchin","conch","clam"]

errors = []
all_rows = []
sid = 0
seen_sci, seen_ko = {}, {}
for zone, cfg in ZONES.items():
    rows = cfg["rows"]
    if len(rows) != EXPECT[zone]:
        errors.append(f"[count] {zone}: got {len(rows)} expected {EXPECT[zone]}")
    for r in rows:
        sid += 1
        ko, en, sci, sub, mx, base, rar, prot = r
        if not isinstance(sci, str):
            errors.append(f"[malformed] id={sid} zone={zone} row={r!r}")
            continue
        low = (en + " " + sci).lower()
        for f in FORBIDDEN:
            if f in low:
                errors.append(f"[non-fish] id={sid} {sci} contains '{f}'")
        if "?" in ko or "?" in en or "?" in sci:
            errors.append(f"[placeholder] id={sid} {ko} / {en} / {sci}")
        if sci in seen_sci:
            errors.append(f"[dup-sci] id={sid} {sci} also #{seen_sci[sci]}")
        else: seen_sci[sci] = sid
        if ko in seen_ko:
            errors.append(f"[dup-ko] id={sid} {ko} also #{seen_ko[ko]}")
        else: seen_ko[ko] = sid
        if not (mx > base > 0):
            errors.append(f"[size] id={sid} {sci} max={mx} base={base}")
        all_rows.append(dict(id=sid, zone=zone, ko=ko, en=en, sci=sci, sub=sub, mx=float(mx), base=float(base), rar=rar, prot=bool(prot), depth=cfg["depth"], temp=cfg["temp"]))

print("total:", sid, "| per-zone counts ok" if not errors else "| ERRORS:")
if errors:
    print("\n".join(errors))
    sys.exit(1)

with open("/workspace/tools/species_rows.json", "w", encoding="utf-8") as fp:
    json.dump(all_rows, fp, ensure_ascii=False, indent=1)
print("VALIDATION OK -> tools/species_rows.json")
