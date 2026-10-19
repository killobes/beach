// SpearPals: Blue Harbor — 200종 어류 데이터 (세션 B 전담)
// 해역 분배: tropical 40 / glacier 30 / volcanic 30 / mangrove 35 / open_ocean 40 / deep_sea 25
// 단위: 길이 cm, 무게 kg. 실측 미확인 수치는 GAME_ESTIMATE.
import { SeededRNG } from '../core/Rng.js';

export const ZONES = Object.freeze({
  tropical:    { id: 'tropical',    name: '열대 산호해',  depthMin: 0,   depthMax: 35,  tempC: 27 },
  mangrove:    { id: 'mangrove',    name: '탁한 하구해',  depthMin: 2,   depthMax: 30,  tempC: 24 },
  glacier:     { id: 'glacier',     name: '한랭 대륙붕',  depthMin: 20,  depthMax: 160, tempC: 2 },
  volcanic:    { id: 'volcanic',    name: '화산 열수해',  depthMin: 10,  depthMax: 120, tempC: 33 },
  open_ocean:  { id: 'open_ocean',  name: '대양 난류해',  depthMin: 10,  depthMax: 120, tempC: 20 },
  deep_sea:    { id: 'deep_sea',    name: '심해 협곡',    depthMin: 60,  depthMax: 300, tempC: 4 },
});

const BEHAVIORS = ['solitary','schooling','fleeing','ambush','benthic_rest','feeding','nocturnal','vertical_migration','territorial'];

// [id, ko, latin, zone, baseLenCm, baseWgtKg, maxLenCm, lenType, a, b, depthMin, depthMax, rarity, protected]
// lenType: TL 전체장 / FL 체장 / SL 표준체장 / HL 두장
// W = a * (L_cm)^b / 1000 → kg (FishBase cm·g 계수 변환 포함)
const RAW = [
[1,'흰동가리','Amphiprion ocellaris','tropical',8,0.025,11,'TL',0.0089,3.05,1,15,1,false],
[2,'흰꼬리나비고기','Chaetodon lineolatus','tropical',20,0.22,30,'SL',0.0091,3.08,2,25,2,false],
[3,'블루탱','Paracanthurus hepatus','tropical',25,0.4,31,'SL',0.0095,3.06,5,30,2,false],
[4,'레드탱','Acanthurus leucosternon','tropical',20,0.3,23,'SL',0.0093,3.07,3,25,2,false],
[5,'데몰란','Chrysiptera hemicyanea','tropical',7,0.02,10,'SL',0.0085,3.1,1,20,1,false],
[6,'커맨드탱','Microspathodon chrysurus','tropical',20,0.25,24,'SL',0.009,3.08,3,30,2,false],
[7,'골든램프','Mecynemus gilvensis','tropical',9,0.03,12,'SL',0.0086,3.09,2,18,2,false],
[8,'클라운고비','Amphigobius melanurus','tropical',6,0.012,8,'SL',0.0082,3.12,1,12,1,false],
[9,'파이어피시','Cantherhules pardalis','tropical',18,0.2,20,'SL',0.0092,3.07,3,28,2,false],
[10,'나폴레온 wrasse','Cheilinus undulatus','tropical',60,4.5,229,'SL',0.014,3.02,3,100,5,true],
[11,'라이언피시','Pterois volitans','tropical',30,0.75,38,'SL',0.0102,3.05,2,55,3,false],
[12,'모리쉬 idol','Holacanthus passer','tropical',22,0.35,26,'SL',0.0094,3.07,3,40,2,false],
[13,'앵젤피시','Pomacanthus imperator','tropical',30,0.9,40,'SL',0.0105,3.05,3,60,3,false],
[14,'버터플라이피시','Chaetodon auriga','tropical',19,0.24,23,'SL',0.0091,3.08,2,30,2,false],
[15,'스포트탱','Zebrasoma flavescens','tropical',17,0.22,20,'SL',0.009,3.08,2,46,2,false],
[16,'파지아마','Sphyraena barracuda','tropical',100,9,170,'FL',0.0118,3.03,3,100,4,false],
[17,'킹메이커럴','Scomberomorus regalis','tropical',70,4.2,120,'FL',0.0112,3.04,5,100,3,false],
[18,'마히마히','Coryphaena hippurus','tropical',90,6,230,'FL',0.0115,3.03,10,200,3,false],
[19,'레드스내퍼','Lutjanus campechanus','tropical',55,2.8,100,'SL',0.0108,3.05,10,90,3,false],
[20,'멘더','Epinephelus guttatus','tropical',40,1.6,60,'SL',0.0104,3.06,8,60,3,false],
[21,'그레이ング스','Haemulon plumierii','tropical',30,0.7,43,'SL',0.0098,3.07,3,40,2,false],
[22,'블루크로퍼','Pomadasys incisus','tropical',45,2,75,'SL',0.0106,3.05,5,60,3,false],
[23,'파이프피시','Aulostomus maculatus','tropical',75,2.4,100,'SL',0.0058,3.15,3,90,3,false],
[24,'트럼펫피시','Aulostomus chinensis','tropical',70,2.2,80,'SL',0.0059,3.15,3,100,3,false],
[25,'네이티브고스트','Myripristis murdjan','tropical',25,0.5,30,'SL',0.0096,3.07,3,60,2,false],
[26,'솔져피시','Myripristis militaris','tropical',24,0.45,29,'SL',0.0095,3.07,3,60,2,false],
[27,'스퀴드피시','Apristurus brachyurus','tropical',35,0.9,50,'TL',0.01,3.06,5,80,3,false],
[28,'스ティング레이','Dasyatis pastinaca','tropical',90,8,140,'TL',0.012,3.02,2,100,3,false],
[29,'리프샤크','Triaenodon obesus','tropical',160,16,210,'TL',0.0135,3.02,3,40,4,false],
[30,'너스샤크','Ginglymostoma cirratum','tropical',220,45,300,'TL',0.014,3.01,2,90,4,false],
[31,'바라쿠다','Sphyraena sphyraena','tropical',85,6.5,150,'FL',0.0114,3.04,3,100,3,false],
[32,'옐로테일','Ocyurus chrysurus','tropical',45,1.8,86,'SL',0.0102,3.06,3,90,2,false],
[33,'크르울','Mulloidichthys martinicus','tropical',25,0.4,40,'SL',0.0094,3.08,5,100,2,false],
[34,'새들백','Siganus fuscescens','tropical',30,0.65,40,'SL',0.0097,3.07,2,50,2,false],
[35,'래빗피시','Siganus virgatus','tropical',28,0.6,35,'SL',0.0096,3.07,2,50,2,false],
[36,'스크래퍼','Plectorhinchus gaterinus','tropical',45,2,75,'SL',0.0105,3.06,5,80,3,false],
[37,'그레이멀렛','Mugil cephalus','tropical',50,2.4,100,'SL',0.01,3.06,1,120,2,false],
[38,'스팀페이거','Pomadasys striatus','tropical',42,1.7,70,'SL',0.0104,3.06,5,60,3,false],
[39,'코랄 트라키','Trachinotus baillonii','tropical',40,1.5,70,'SL',0.0103,3.06,3,60,2,false],
[40,'파이브밴드','Barbus pentazona','tropical',30,0.7,45,'SL',0.0098,3.07,2,40,2,false],

[41,'南极빙어','Pagothenia borchgrevinki','glacier',18,0.09,28,'SL',0.0088,3.1,5,200,2,false],
[42,'아이스크로드','Notothenia coriiceps','glacier',40,1.4,65,'SL',0.0101,3.06,10,200,3,false],
[43,'티소드피시','Champsocephalus gunnari','glacier',50,2.2,90,'SL',0.0105,3.05,20,300,3,false],
[44,'블러드웜피시','Pareledia charcoti','glacier',12,0.04,16,'SL',0.0084,3.11,15,400,2,false],
[45,'드로코피시','Drambe macrophthalmus','glacier',30,0.7,45,'SL',0.0097,3.07,20,250,3,false],
[46,'南极대구','Merluccius australis','glacier',90,6,140,'SL',0.0115,3.04,50,2000,4,false],
[47,'氷海상어','Somniosus macrodon','glacier',250,55,350,'TL',0.0142,3.0,50,1200,5,false],
[48,'프레카피시','Bovichtus angustifrons','glacier',25,0.45,35,'SL',0.0094,3.08,10,200,2,false],
[49,'노토타니아','Notothenia neglecta','glacier',35,0.95,50,'SL',0.0099,3.07,15,300,3,false],
[50,'하프마우스','Notolthenia rasstriga','glacier',28,0.6,40,'SL',0.0096,3.07,20,400,2,false],
[51,'크린피시','Harpagifer antarcticus','glacier',10,0.02,14,'SL',0.0083,3.12,5,100,1,false],
[52,'아이스페일','Artedius lateralis','glacier',15,0.06,22,'SL',0.0087,3.1,5,150,2,false],
[53,'南极정어리','Thysanoessa macura','glacier',6,0.005,9,'TL',0.0078,3.15,0,500,1,false],
[54,'콜로서 피시','Colossopis georgianus','glacier',45,1.8,70,'SL',0.0104,3.06,30,500,3,false],
[55,'프로디피시','Porcodermis glacialis','glacier',38,1.1,55,'SL',0.01,3.07,25,350,3,false],
[56,'글레이셜레이','Raja hyperborea','glacier',110,9,160,'TL',0.0122,3.03,30,800,4,false],
[57,'南极문어피시','Lycenchelys camchatica','glacier',40,0.5,60,'TL',0.0062,3.15,100,2000,3,false],
[58,'프론프론','Gadiculus argenteus','glacier',14,0.035,18,'SL',0.0085,3.11,50,600,2,false],
[59,'아르젠틐','Argentina argentini','glacier',30,0.35,45,'SL',0.009,3.09,50,1000,2,false],
[60,'南极등 푸른','Micromesistius australis','glacier',60,2.8,90,'SL',0.0108,3.05,50,1000,3,false],
[61,'크릴피시','Electrona risso','glacier',8,0.012,11,'SL',0.0081,3.12,20,300,1,false],
[62,'슬렌드 아이스','Salangoides glacialis','glacier',12,0.025,16,'SL',0.0083,3.12,5,150,1,false],
[63,'南极숭어','Champsocephalus esox','glacier',55,2.5,80,'SL',0.0106,3.05,30,400,3,false],
[64,'아이스굴','Pleuragramma antarcticum','glacier',14,0.04,19,'SL',0.0086,3.11,0,700,2,false],
[65,'프레즈피시','Bellotinella megalura','glacier',9,0.015,12,'SL',0.0082,3.12,30,500,1,false],
[66,'南极 가재치','Zoarces viviparus','glacier',25,0.35,40,'SL',0.0093,3.08,5,200,2,false],
[67,'콜드워터 샤크','Dalatias licha','glacier',80,4,180,'TL',0.0118,3.04,100,2000,4,false],
[68,'딥프리즈','Etmopterus spinax','glacier',35,0.5,60,'TL',0.0092,3.09,200,2000,3,false],
[69,'南极 램프레이','Eptatretus burgeri','glacier',45,0.4,75,'TL',0.0045,3.18,50,500,3,false],
[70,'글레이셜 이징','Symphodus bailloni','glacier',20,0.2,28,'SL',0.0089,3.09,10,150,2,false],

[71,'화산 고비','Pandaka silvana','volcanic',5,0.008,7,'SL',0.008,3.13,1,30,1,false],
[72,'라우피시','Salaria pavo','volcanic',12,0.03,17,'SL',0.0085,3.11,1,40,1,false],
[73,'블레이즈탱','Nannoblennius pyrocraspis','volcanic',15,0.06,20,'SL',0.0087,3.1,2,50,2,false],
[74,'마그마 스커틴','Scortinium igneus','volcanic',30,0.65,45,'SL',0.0097,3.07,5,80,2,false],
[75,'숄피시','Enchoscephalus galapagensis','volcanic',20,0.25,28,'SL',0.0091,3.08,5,100,2,false],
[76,'칼데라 바스','Lateolabrax calderae','volcanic',50,2.3,80,'SL',0.0105,3.06,5,120,3,false],
[77,'임버 피츠','Pempheris imberbis','volcanic',25,0.4,35,'SL',0.0094,3.08,5,90,2,false],
[78,'플레임 레이','Leucoraja ignea','volcanic',70,3.5,100,'TL',0.0115,3.04,10,200,3,false],
[79,'오브시디언 그럽','Gobiopsis obsidiana','volcanic',10,0.02,14,'SL',0.0083,3.12,2,60,1,false],
[80,'서퍼피시','Hyperglypheus sulfurus','volcanic',18,0.15,25,'SL',0.0088,3.1,1,50,2,false],
[81,'热수 게치','Bythites thermalus','volcanic',22,0.2,32,'SL',0.009,3.09,10,150,2,false],
[82,'볼케이노 울프','Anarhichas vulcani','volcanic',120,12,180,'TL',0.0125,3.03,20,300,4,false],
[83,'크레이터 피시','Centrolabrus crateris','volcanic',16,0.1,22,'SL',0.0087,3.1,3,70,2,false],
[84,'asl라바 블레니','Aspidontus lavae','volcanic',12,0.03,16,'SL',0.0085,3.11,2,50,1,false],
[85,'엠버 젤리피시','Stichopus flammeus','volcanic',35,0.8,50,'SL',0.0099,3.07,5,120,3,false],
[86,'피리로스트','Pyrofrostus ventris','volcanic',28,0.55,40,'SL',0.0095,3.08,10,160,2,false],
[87,'설퍼 스콜피온','Scorpaena sulphurea','volcanic',30,0.7,45,'SL',0.0097,3.07,5,100,3,false],
[88,'마스 에이저','Aegirus maris','volcanic',40,1.2,60,'SL',0.0101,3.07,10,180,3,false],
[89,'히트싱크','Thermincola absorbens','volcanic',20,0.24,28,'SL',0.0091,3.08,5,90,2,false],
[90,'포스 피시','Phosphorescentia ignota','volcanic',15,0.08,21,'SL',0.0087,3.1,10,200,2,false],
[91,'라우스틸','Ferrodus rufescens','volcanic',50,2.1,75,'SL',0.0104,3.06,15,250,3,false],
[92,'칼슘 크랩피시','Carcinops calcarea','volcanic',18,0.14,25,'SL',0.0088,3.1,5,100,2,false],
[93,'벤트 불','Ventirlampadis brevicauda','volcanic',25,0.4,36,'SL',0.0094,3.08,20,300,3,false],
[94,'마그마톤','Magmaton profundus','volcanic',60,3,90,'SL',0.0107,3.06,30,400,4,false],
[95,'애쉬 그리핀','Griffinash cineris','volcanic',33,0.75,48,'SL',0.0098,3.07,10,180,3,false],
[96,'스팀 보틀','Botellus vaporis','volcanic',14,0.05,20,'SL',0.0086,3.11,2,60,1,false],
[97,'옵시디언 타이','Zanclodus obsidianus','volcanic',45,1.9,65,'SL',0.0103,3.06,10,200,3,false],
[98,'핫스프링 카프','Cyprinus thermarum','volcanic',25,0.42,35,'SL',0.0094,3.08,1,50,2,false],
[99,'볼트 피시','Voltichthys electricus','volcanic',22,0.22,30,'SL',0.009,3.09,5,120,2,false],
[100,'코어 멜터','Coremelter abyssalis','volcanic',80,6,120,'SL',0.0115,3.05,50,600,4,false],

[101,'맹그로브 perch','Perca mangroviae','mangrove',20,0.2,28,'SL',0.0091,3.08,1,20,1,false],
[102,'머드 스킵잭','Sprattus limosa','mangrove',12,0.025,16,'SL',0.0084,3.11,0,15,1,false],
[103,'루트 피시','Lutjanus rhizophorae','mangrove',40,1.3,60,'SL',0.0101,3.06,2,40,2,false],
[104,'탄bdb러','Mugil tumbula','mangrove',35,0.85,50,'SL',0.0098,3.07,1,30,2,false],
[105,'크릭 블루길','Lepomis rivularis','mangrove',18,0.15,25,'SL',0.0088,3.1,1,20,1,false],
[106,'브ack워터 배스','Micropterus backwateri','mangrove',35,1,55,'SL',0.0099,3.07,1,30,2,false],
[107,'셀피시','Cellarius palustris','mangrove',25,0.4,35,'SL',0.0094,3.08,1,25,2,false],
[108,'밀 리프','Atherina milva','mangrove',10,0.018,14,'SL',0.0083,3.12,0,15,1,false],
[109,'터바이드','Torba limosa','mangrove',30,0.6,42,'SL',0.0096,3.07,2,35,2,false],
[110,'갈리피시','Galeichthys feliceps','mangrove',55,2.6,80,'SL',0.0106,3.05,2,50,3,false],
[111,'샤크 곤','Rhizoprionodon portoricensis','mangrove',70,3.5,100,'TL',0.0118,3.04,1,60,3,false],
[112,'레이 스모크','Dasyatis sabina','mangrove',60,2.5,90,'TL',0.0112,3.05,1,40,3,false],
[113,'크랩헌터','Callionymus scorpio','mangrove',16,0.07,22,'SL',0.0087,3.1,2,30,1,false],
[114,'슬릭 피시','Silurus limosus','mangrove',65,3.2,100,'SL',0.0108,3.05,1,40,3,false],
[115,'마udas 캐릿','Caranx maulitus','mangrove',45,1.7,70,'SL',0.0103,3.06,2,50,2,false],
[116,'허링 머드','Brevoortia limosa','mangrove',22,0.18,30,'SL',0.0089,3.09,0,25,1,false],
[117,'틸apia 루트','Oreochromis rhizophorae','mangrove',28,0.5,40,'SL',0.0095,3.08,1,30,2,false],
[118,'캣피시 브라운','Ameiurus nebulosa','mangrove',40,1.4,60,'SL',0.0101,3.06,1,35,2,false],
[119,'선피시','Sunfishus manglar','mangrove',14,0.045,20,'SL',0.0086,3.11,1,20,1,false],
[120,'와드 피시','Watsonius alligatoris','mangrove',100,7,150,'TL',0.012,3.04,1,50,4,false],
[121,'포피 피시','Popillus brillians','mangrove',18,0.13,25,'SL',0.0088,3.1,2,30,1,false],
[122,'스레드 펄','Pearlthreadus tenuis','mangrove',8,0.012,11,'SL',0.0081,3.12,0,15,1,false],
[123,'보텀 워커','Bentholestes limicola','mangrove',32,0.7,45,'SL',0.0097,3.07,1,30,2,false],
[124,'미드짓 지길','Gigellus medius','mangrove',24,0.32,34,'SL',0.0092,3.08,1,25,2,false],
[125,'브러시 노즈','Rhinobrachio pilosus','mangrove',20,0.2,28,'SL',0.0091,3.08,2,35,1,false],
[126,'코퍼 핀','Trachinotus cupreus','mangrove',38,1,55,'SL',0.01,3.07,2,45,2,false],
[127,'암버 주짓','Judgittus umbra','mangrove',15,0.06,21,'SL',0.0087,3.1,1,25,1,false],
[128,'마즐 피시','Maculellus fluviatilis','mangrove',26,0.4,36,'SL',0.0093,3.08,1,30,2,false],
[129,'스노우트','Snoutius albus','mangrove',12,0.028,17,'SL',0.0085,3.11,0,20,1,false],
[130,'플랫헤드','Platycephalus manglaris','mangrove',45,1.6,65,'SL',0.0102,3.06,1,40,2,false],
[131,'그린 파이어','Fireviridis lumina','mangrove',17,0.09,24,'SL',0.0088,3.1,2,30,1,false],
[132,'머들 스컬','Scalus turbidus','mangrove',22,0.2,30,'SL',0.009,3.09,1,25,2,false],
[133,'바운드 피시','Boundus saltator','mangrove',19,0.16,26,'SL',0.0089,3.09,1,30,1,false],
[134,'타이드 포드','Tidepodus minimus','mangrove',6,0.008,9,'SL',0.008,3.13,0,10,1,false],
[135,'만 글래스','Glassomanus mandei','mangrove',11,0.02,15,'SL',0.0084,3.12,1,20,1,false],
[136,'루츠 랜딩','Rootlandia radix','open_ocean',29,0.5,40,'SL',0.0095,3.08,2,35,2,false],
[137,'눈다랑어','Thunnus oblongus','open_ocean',120,15,250,'FL',0.0128,3.03,10,500,4,false],
// 137 눈다랑어: FL/TL 측정 기준 자료 충돌 → RECHECK_REQUIRED (V3.1 검증 대기 상태 유지)
[138,'황다랑어','Thunnus albacares','open_ocean',110,12,240,'FL',0.0125,3.03,10,400,4,false],
[139,'참다랑어','Thunnus thynnus','open_ocean',150,22,458,'FL',0.0135,3.02,10,500,5,false],
[140,'가다랑어','Katsuwonus pelamis','open_ocean',60,3.5,110,'FL',0.011,3.05,0,260,3,false],
[141,'새치','Xiphias gladius','open_ocean',200,60,455,'FL',0.014,3.01,10,500,5,false],
[142,'깃치','Tetrapturus audax','open_ocean',180,45,330,'FL',0.0135,3.02,10,300,5,false],
[143,'방어','Seriola quinqueradiata','open_ocean',80,8,150,'SL',0.0118,3.04,20,200,3,false],
[144,'전갱이','Caranx hippos','open_ocean',60,3.8,120,'SL',0.0112,3.05,10,200,3,false],
[145,'삼치','Scomber japonicus','open_ocean',40,1,64,'SL',0.0098,3.07,0,200,2,false],
[146,'고등어','Scomber scombrus','open_ocean',35,0.7,60,'SL',0.0095,3.08,0,220,2,false],
[147,'갈치','Trichiurus lepturus','open_ocean',90,2.5,160,'TL',0.0042,3.2,50,500,3,false],
[148,'오징어노리','Berryma verilli','open_ocean',25,0.3,35,'SL',0.0092,3.08,20,300,2,false],
[149,'청새치','Makaira nigricans','open_ocean',240,80,489,'FL',0.0142,3.0,10,500,5,false],
[150,'돌고래고등어','Coryphaena equiselis','open_ocean',70,4,140,'FL',0.0114,3.04,10,200,3,false],
[151,'가자미대양','Pseudopleuronectes herzensteini','open_ocean',40,1.2,60,'SL',0.01,3.07,20,200,2,false],
[152,'성대','Microstomus achne','open_ocean',45,1.5,70,'SL',0.0102,3.06,30,250,2,false],
[153,'도다리와','Lotella rhacinus','open_ocean',35,0.8,50,'SL',0.0097,3.07,20,150,2,false],
[154,'메기대양','Arius thalassinus','open_ocean',55,2.4,85,'SL',0.0106,3.05,10,180,3,false],
[155,'복어대양','Lagocephalus sceleratus','open_ocean',50,2.2,80,'SL',0.0105,3.06,10,150,3,false],
[156,'범꼬리','Choerodon rubescens','open_ocean',45,1.8,70,'SL',0.0103,3.06,10,120,3,false],
[157,'놀래기','Scarus frenatus','open_ocean',40,1.4,60,'SL',0.0101,3.06,5,100,2,false],
[158,'제bil피시','Zebrasoma velifer','open_ocean',30,0.7,40,'SL',0.0097,3.07,5,90,2,false],
[159,'후식','Halichoeres marginatus','open_ocean',20,0.25,28,'SL',0.0091,3.08,5,80,2,false],
[160,'용왕','Lethrinus miniatus','open_ocean',55,2.6,95,'SL',0.0106,3.05,10,100,3,false],
[161,'부시리','Gonorynchus greyi','open_ocean',60,2.8,90,'SL',0.0107,3.05,10,150,3,false],
[162,'상사','Scomberomorus koreanus','open_ocean',75,5,120,'FL',0.0115,3.04,10,200,3,false],
[163,'갈치살','Evoxymetopon taeniatus','open_ocean',80,2.2,140,'TL',0.0043,3.2,50,600,3,false],
[164,'망둥원양','Amblygobius sphinx','open_ocean',12,0.03,17,'SL',0.0085,3.11,10,120,1,false],
[165,'전어대양','Pristigenys niphadia','open_ocean',35,0.85,50,'SL',0.0098,3.07,10,100,2,false],
[166,'멸치대양','Engraulis japonicus','open_ocean',15,0.04,20,'SL',0.0086,3.11,0,100,1,false],
[167,'정어리대양','Sardinella melanura','open_ocean',20,0.1,28,'SL',0.0089,3.09,0,120,1,false],
[168,'꽁치대양','Cololabis saira','open_ocean',30,0.3,40,'SL',0.0092,3.08,0,270,2,false],
[169,'가오리대양','Mobula tarapacana','open_ocean',180,25,300,'TL',0.0132,3.02,10,300,4,false],
[170,'상어청鲨','Prionace glauca','open_ocean',250,60,380,'TL',0.014,3.01,10,400,5,false],
[171,'만鲨鱼','Carcharhinus amblyrhynchos','open_ocean',150,20,250,'TL',0.0132,3.02,10,300,4,false],
[172,'귀상어','Squalus acanthias','open_ocean',70,3,100,'TL',0.0115,3.04,20,1000,3,false],
[173,'메기원양','Channichthys oculeus','open_ocean',30,0.5,42,'SL',0.0095,3.08,20,200,2,false],
[174,'연어대양','Oncorhynchus maris','open_ocean',65,4,110,'SL',0.0112,3.05,0,200,3,false],
[175,'심해앵커','Lophius piscatorius','deep_sea',120,18,200,'TL',0.013,3.02,50,1000,4,false],
[176,'악어상어','Mitsukurina owstoni','deep_sea',300,60,380,'TL',0.0142,3.0,200,1500,5,false],
[177,'anglerfish','Melanocetus johnsonii','deep_sea',10,0.05,18,'SL',0.0095,3.08,500,2500,4,false],
[178,'viperfish','Chauliodus sloani','deep_sea',30,0.2,59,'TL',0.0075,3.13,200,2000,4,false],
[179,'lanternfish','Myctophum punctatum','deep_sea',9,0.01,17,'SL',0.008,3.12,100,1000,2,false],
[180,'bristlemouth','Cyclothone microdon','deep_sea',8,0.006,12,'SL',0.0078,3.14,200,1500,2,false],
[181,'gulper','Eurypharynx pelecanoides','deep_sea',75,1.5,100,'TL',0.0035,3.2,500,3000,4,false],
[182,'fangtooth','Anoplogaster cornuta','deep_sea',16,0.12,18,'SL',0.009,3.1,500,5000,4,false],
[183,'dumbooctopusfish','Grimpotelethis abyssi','deep_sea',25,0.3,30,'TL',0.0092,3.09,1000,4000,5,false],
[184,'barreleye','Macropinna microstoma','deep_sea',15,0.08,20,'SL',0.0087,3.11,400,1000,4,false],
[185,'snailfish','Pseudoliparis swirei','deep_sea',24,0.2,27,'SL',0.0091,3.1,6000,8000,5,false],
[186,'blackdragon','Idiacanthus antrostomus','deep_sea',30,0.25,35,'TL',0.0076,3.14,200,2000,3,false],
[187,'sabertooth','Diretmus argenteus','deep_sea',18,0.1,24,'SL',0.0088,3.11,500,2000,3,false],
[188,'pelicaneel','Derhimus maximus','deep_sea',40,0.15,60,'TL',0.0023,3.25,1000,4000,4,false],
[189,'coelacanth','Latimeria chalumnae','deep_sea',150,40,200,'SL',0.0135,3.02,100,700,5,true],
[190,'oarfish','Regalecus glesne','deep_sea',500,50,800,'TL',0.0004,3.3,200,1000,5,false],
[191,'frilledshark','Chlamydoselachus anguineus','deep_sea',150,12,200,'TL',0.0128,3.03,500,1500,5,false],
[192,'goblinmage','Scymnodon ringens','deep_sea',90,5,110,'TL',0.0118,3.04,400,1200,4,false],
[193,'sandtiger','Carcharias taurus','open_ocean',250,70,320,'TL',0.0142,3.0,10,190,5,false],
[194,'sixgill','Hexanchus griseus','deep_sea',300,80,480,'TL',0.0145,3.0,10,2500,5,false],
[195,'bluntnotseel','Notacanthus chemnitzii','deep_sea',60,0.6,100,'TL',0.0028,3.22,200,1500,3,false],
[196,'deependragon','Bathophilus longipinnis','deep_sea',22,0.05,28,'TL',0.0072,3.15,300,1500,3,false],
[197,'tripletail','Thalassomenous paradoxus','deep_sea',20,0.12,26,'SL',0.0089,3.1,200,600,4,false],
[198,'deepsea hatchet','Argyropelecus gigas','deep_sea',10,0.02,15,'SL',0.0082,3.12,200,1000,3,false],
[199,'melanocetus','Melanocetus murrayi','deep_sea',12,0.04,20,'SL',0.0085,3.11,400,2500,4,false],
[200,'giantsquidfish','Taningia titanis','deep_sea',180,30,250,'TL',0.013,3.02,300,2000,5,false],
];

// ---- 데이터 정합화 (게임 밸런스 조정, 생물학적 원자료 보존) ----
// 1) 체장–체중 관계식 보정: 스폰은 W = wlA * L^wlB / 1000 (kg) 공식만 사용하므로,
//    기준 길이(gameLengthCm)에서 관계식이 선언된 게임 기준 무게(gameWeightKg)와
//    대략 일치하도록 wlA를 자동 재계산한다. (b는 유지, ±30% 이상 어긋날 때만 보정)
//    원시 계수는 rawWlA/rawWlB로 보존 → 검증 상태와 분리.
// 2) 서식 수심 클램프: 게임 월드 최대 수심 300m 및 해역 수심 범위에 맞춰
//    depthMin/Max를 게임용으로 압축한다. 실제 보고 수심은 realDepthMinM/realDepthMaxM에 보존.
const MAX_GAME_DEPTH = 300;

function reconcileWeight(species) {
  const calc = species.wlA * Math.pow(species.gameLengthCm, species.wlB) / 1000;
  if (!(calc > 0) || !(species.gameWeightKg > 0)) return;
  const ratio = calc / species.gameWeightKg;
  if (ratio < 0.7 || ratio > 1.4) {
    species.wlA = (species.wlA * species.gameWeightKg) / calc;
    species.weightReconciled = true;
  }
}

function clampDepth(sp, zone) {
  sp.realDepthMinM = sp.depthMinM;
  sp.realDepthMaxM = sp.depthMaxM;
  const zmin = ZONES[zone].depthMin;
  const zmax = Math.min(ZONES[zone].depthMax, MAX_GAME_DEPTH);
  let lo = Math.max(sp.depthMinM, zmin);
  let hi = Math.min(Math.max(sp.depthMaxM, zmin + 5), zmax);
  if (hi - lo < 2) { // 폭이 너무 좁으면 해역 범위 안에서 균등 확장
    lo = zmin; hi = zmax;
  }
  sp.depthMinM = Math.round(lo * 10) / 10;
  sp.depthMaxM = Math.round(hi * 10) / 10;
  sp.depthClamped = sp.realDepthMaxM > zmax || sp.realDepthMinM < zmin;
}

export function buildSpecies() {
  return RAW.map(r => {
    const s = {
      id: r[0],
      nameKo: r[1],
      scientificName: r[2],
      zone: r[3],
      gameLengthCm: r[4],        // 게임 기준 길이 (cm)
      gameWeightKg: r[5],        // 게임 기준 무게 (kg)
      maxLengthCm: r[6],         // 게임 생성 최대 길이 (cm)
      lengthType: r[7],          // TL/FL/SL/HL
      wlA: r[8],                 // 체장-체중 계수 a (cm,g 기준, 정합화 후)
      wlB: r[9],                 // 지수 b
      rawWlA: r[8],              // 원시 계수 (보고값 보존)
      rawWlB: r[9],
      depthMinM: r[10],          // 최소 서식 수심 (m, 게임용)
      depthMaxM: r[11],          // 최대 서식 수심 (m, 게임용)
      rarity: r[12],             // 1~5
      protected: r[13],          // 보호종 (포획 금지, 관찰 전용)
      minGenLengthCm: Math.round(r[4] * 0.5),
      spawnLengthStdPct: 20,     // 기준 길이의 20% 표준편차
      measuredAvgLengthCm: null, // 실측 평균 (GAME_ESTIMATE: null 유지)
      measuredAvgWeightKg: null,
      reportedMaxLengthCm: r[6],
      verification: r[0] === 137 ? 'RECHECK_REQUIRED' : 'GAME_ESTIMATE', // 137 눈다랑어: FL/TL 자료 충돌
      behaviors: defaultBehaviors(r[3], r[12]),
      weightReconciled: false,
      depthClamped: false,
    };
    reconcileWeight(s);
    clampDepth(s, r[3]);
    return s;
  });
}

function defaultBehaviors(zone, rarity) {
  if (zone === 'deep_sea') return ['solitary','benthic_rest','ambush','nocturnal'];
  if (zone === 'glacier') return ['solitary','schooling','feeding'];
  if (zone === 'volcanic') return ['ambush','territorial','benthic_rest'];
  if (zone === 'mangrove') return ['schooling','feeding','territorial','fleeing'];
  if (zone === 'open_ocean') return rarity >= 4 ? ['solitary','feeding','vertical_migration'] : ['schooling','feeding','vertical_migration'];
  return rarity >= 4 ? ['solitary','territorial','ambush'] : ['schooling','feeding','fleeing'];
}

// ---- 개체 생성 ----
// 체장-체중 관계: W(g) = a * L(cm)^b → kg 변환 (/1000)
export function weightFromLength(species, lengthCm) {
  const grams = species.wlA * Math.pow(lengthCm, species.wlB);
  return grams / 1000;
}

export function makeSpecimen(species, rng, seq) {
  const std = species.gameLengthCm * (species.spawnLengthStdPct / 100);
  let len = species.gameLengthCm;
  for (let i = 0; i < 12; i++) {
    const v = rng.normal(species.gameLengthCm, std);
    if (v >= species.minGenLengthCm && v <= species.maxLengthCm) { len = v; break; }
    len = Math.min(Math.max(v, species.minGenLengthCm), species.maxLengthCm);
  }
  len = Math.round(len * 10) / 10;
  const wgt = Math.round(weightFromLength(species, len) * 1000) / 1000;
  return {
    specimenId: `fish_${String(species.id).padStart(3,'0')}_${seq}`,
    speciesId: species.id,
    lengthCm: len,
    weightKg: wgt,
    growthStage: len < species.gameLengthCm * 0.7 ? 'juvenile' : (len > species.maxLengthCm * 0.85 ? 'elder' : 'adult'),
    sex: rng.next() < 0.5 ? 'F' : 'M',
  };
}

export const VALIDATION_SPECIES_IDS = [1, 3, 6, 10, 29];
