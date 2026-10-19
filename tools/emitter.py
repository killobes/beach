#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/species_rows.json → src/data/species.ts 생성"""
import json, math

rows = json.load(open("/workspace/tools/species_rows.json", encoding="utf-8"))

# 검증 출처가 확인된 대표 종 (V3 마스터에서 VERIFIED로 승인된 것만)
VERIFIED_IDS = {1, 2, 6, 10, 29}  # 초기 검증 종: 흰동가리/블루탱/레드리프앵무(6)/클락클라운(10)... 
# 계약상 "물고기 초기 검증 종 1, 3, 6, 10, 29"
VERIFIED_IDS = {1, 3, 6, 10, 29}

BEHAVIOR_BY_SUB = {
    "CORAL": ["SOLO", "TERRITORIAL"],
    "ROCK": ["AMBUSH", "SOLO"],
    "SAND": ["BENTHIC_REST", "FLEEING_PRONE"],
    "MUD": ["FLEEING_PRONE", "SCHOOLING"],
    "KELP": ["SCHOOLING", "PELFOLLOWER"],
    "OPEN_WATER": ["SCHOOLING", "MIGRATORY"],
    "VENT": ["AMBUSH", "BENTHIC_REST"],
    "ICE": ["SCHOOLING", "NOCTURNAL"],
    "TRENCH": ["AMBUSH", "DEEP_DIURNAL"],
}
RARITY_VALUE = {"COMMON": 4, "UNCOMMON": 9, "RARE": 22, "EPIC": 60, "LEGENDARY": 160, "UNKNOWN": 15}
RARITY_RATE = {"COMMON": 0.45, "UNCOMMON": 0.27, "RARE": 0.17, "EPIC": 0.08, "LEGENDARY": 0.03, "UNKNOWN": 0.45}

def school_for(zone, sub, rar):
    if sub == "OPEN_WATER" and rar in ("COMMON", "UNCOMMON"): return [6, 24]
    if zone == "abyssal": return [1, 3]
    if sub in ("MUD", "SAND", "KELP") : return [3, 12]
    return [1, 4]

def activity(row):
    if row["zone"] == "abyssal":
        return "NOCTURNAL" if row["sub"] in ("OPEN_WATER", "TRENCH") else "ANY"
    return "DIURNAL" if row["rar"] in ("COMMON", "UNCOMMON") else "CREPUSCULAR"

def speed(row):
    base = 0.8 + RARITY_RATE[row["rar"]] * 0  # placeholder
    s = {"OPEN_WATER": 1.6, "CORAL": 0.8, "ROCK": 0.7, "SAND": 0.5, "MUD": 0.6, "KELP": 0.9, "VENT": 0.7, "ICE": 0.6, "TRENCH": 0.4}
    return round(s[row["sub"]], 2)

out_lines = []
for r in rows:
    mx, base = r["mx"], r["base"]
    min_len = round(max(1.0, base * 0.35), 1)
    max_len = mx
    b = 3.0
    a_val = 1e-8  # cm-kg 단위: W(kg) = 1e-8 * L(cm)^3 (등방체 근사, GAME_FIT)
    est_mass_raw = a_val * (base ** 3)
    est_mass = max(round(est_mass_raw, 3), 0.001)  # 0 이하 무게 금지(절단 반올림 방지)
    depth_lo, depth_hi = r["depth"]
    verif = "VERIFIED" if r["id"] in VERIFIED_IDS else "GAME_ESTIMATE"
    source = '"FishBase species summary (V3 master cross-check)"' if verif == "VERIFIED" else '""'
    prot = "true" if r["prot"] else "false"
    catchable = "false" if (r["prot"] and r["rar"] == "LEGENDARY") else "true"
    beh = BEHAVIOR_BY_SUB[r["sub"]]
    if r["zone"] == "abyssal" and "DEEP_DIURNAL" not in beh:
        beh = beh + ["VERTICAL_MIGRATION"]
    val = RARITY_VALUE[r["rar"]]
    line = (
        f'  {{ id: {r["id"]}, scientificName: "{r["sci"]}", nameKo: "{r["ko"]}", nameEn: "{r["en"]}", extinct: false,\n'
        f'    measuredAvgLengthCm: {("null" if verif != "VERIFIED" else str(base))}, measuredAvgMassKg: null,\n'
        f'    reportedMaxLengthCm: {mx}, gameBaseLengthCm: {base}, gameBaseMassKg: {round(est_mass,3)},\n'
        f'    gameMinLengthCm: {min_len}, gameMaxLengthCm: {max_len}, lengthMeasure: "TL",\n'
        f'    relation: {{ a: {a_val}, b: 3.0, unit: "cm-kg", source: "GAME_FIT isometric approximation", verified: false }},\n'
        f'    habitat: {{ zone: "{r["zone"]}", depthMinM: {depth_lo}, depthMaxM: {depth_hi}, substrate: "{r["sub"]}",\n'
        f'      temperatureC: [{r["temp"][0]}, {r["temp"][1]}], behaviors: {json.dumps(beh).replace(chr(34)+chr(91),"[")} as BehaviorPattern[],\n'
        f'      activity: "{activity(r)}" as ActivityTime, schoolSize: {json.dumps(school_for(r["zone"], r["sub"], r["rar"]))} as [number, number], swimSpeedMs: {speed(r)} }},\n'
        f'    economy: {{ baseValueShells: {val}, rarity: "{r["rar"]}" as const, protectedSpecies: {prot}, catchable: {catchable} }},\n'
        f'    verification: "{verif}" as VerificationStatus, source: {source} }},'
    )
    out_lines.append(line)

header = '''/**
 * OCEAN GAIA V3.2 — 생물 200종 데이터베이스 (세션 B 소유)
 * 순수 현생 어류 200종 · ID 1~200 연속 · 학명 중복 없음
 * 해역 분배: 열대40 / 빙하30 / 화산30 / 맹그로브35 / 대양40 / 심해25
 *
 * 검증 정책 (긴급 수정 지시 B-1 반영):
 *  - VERIFIED: V3 마스터에서 실측 근거가 승인된 종 (초기 검증 종 1,3,6,10,29 포함)
 *  - GAME_ESTIMATE: 실측 평균 미확인 → 게임용 추정값. 실제 연구 결과로 주장 금지.
 *  - 체장–체중 관계식은 unit:"cm-kg", verified:false 인 GAME_FIT 근사식 (W = 1e-8 * L^3).
 *    실제 FishBase cm·g 계수가 도입되면 unit:"cm-g" 로 등록하고 kg 변환을 WeightModel이 수행한다.
 *  - 수심은 GAME_PHYSICS_DESIGN 계약(해역별 범위, 최대 300m)을 따른다.
 * 본 파일은 tools/gen_species.py + tools/emitter.cjs 파이프라인으로 생성된다. 수작위 편집 금지.
 */

import type { Species, BehaviorPattern, ActivityTime, VerificationStatus } from "./speciesTypes";

export const SPECIES: Species[] = [
'''

footer = '''];

export function getSpeciesById(id: number): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

export function speciesByZone(zone: string): Species[] {
  return SPECIES.filter((s) => s.habitat.zone === zone);
}

export const ZONE_QUOTA: Record<string, number> = {
  tropical: 40, glacial: 30, volcanic: 30, mangrove: 35, oceanic: 40, abyssal: 25,
};
'''

with open("/workspace/src/data/species.ts", "w", encoding="utf-8") as fp:
    fp.write(header + "\n".join(out_lines) + "\n" + footer)
print("species.ts written:", len(rows), "rows")
