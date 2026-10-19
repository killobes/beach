// OCEAN GAIA V3.2 — Save Manager
// 세션 B 소유 — Three.js import 금지

import type { GameState } from '../core/GameEngine';

export interface SaveData {
  version: string;
  timestamp: number;
  playTimeSec: number;
  state: GameState;
  rngState: number;
  uidCounter: number;
  checksum: string;
}

export interface SaveSlot {
  id: number;
  name: string;
  timestamp: number;
  playTimeSec: number;
  version: string;
  shells: number;
  speciesDiscovered: number;
  shipLevel: number;
  title: string;
}

const SAVE_KEY_PREFIX = 'oceangaia_save_';
const SAVE_SLOTS = 3;
const CURRENT_VERSION = '3.2.0';

export class SaveManager {
  /**
   * Simple checksum for save data integrity
   */
  private static computeChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Save game to a specific slot
   */
  static save(slotId: number, state: GameState, rngState: number, uidCounter: number): { success: boolean; error?: string } {
    if (slotId < 0 || slotId >= SAVE_SLOTS) {
      return { success: false, error: 'Invalid save slot' };
    }

    try {
      const saveData: SaveData = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        playTimeSec: state.gameTimeSec,
        state,
        rngState,
        uidCounter,
        checksum: '',
      };

      // Compute checksum
      const stateStr = JSON.stringify({ state: saveData.state, rngState: saveData.rngState });
      saveData.checksum = SaveManager.computeChecksum(stateStr);

      const key = SAVE_KEY_PREFIX + slotId;
      localStorage.setItem(key, JSON.stringify(saveData));

      return { success: true };
    } catch (e) {
      return { success: false, error: `Save failed: ${e}` };
    }
  }

  /**
   * Load game from a specific slot
   */
  static load(slotId: number): { success: boolean; data?: SaveData; error?: string } {
    if (slotId < 0 || slotId >= SAVE_SLOTS) {
      return { success: false, error: 'Invalid save slot' };
    }

    try {
      const key = SAVE_KEY_PREFIX + slotId;
      const raw = localStorage.getItem(key);
      if (!raw) {
        return { success: false, error: 'No save data in this slot' };
      }

      const saveData: SaveData = JSON.parse(raw);

      // Version check
      if (saveData.version !== CURRENT_VERSION) {
        return { success: false, error: `Version mismatch: save=${saveData.version}, current=${CURRENT_VERSION}` };
      }

      // Checksum verification
      const stateStr = JSON.stringify({ state: saveData.state, rngState: saveData.rngState });
      const expectedChecksum = SaveManager.computeChecksum(stateStr);
      if (saveData.checksum !== expectedChecksum) {
        return { success: false, error: 'Save data corrupted (checksum mismatch)' };
      }

      return { success: true, data: saveData };
    } catch (e) {
      return { success: false, error: `Load failed: ${e}` };
    }
  }

  /**
   * Get info about all save slots
   */
  static getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];

    for (let i = 0; i < SAVE_SLOTS; i++) {
      const key = SAVE_KEY_PREFIX + i;
      const raw = localStorage.getItem(key);

      if (raw) {
        try {
          const saveData: SaveData = JSON.parse(raw);
          const state = saveData.state;
          const speciesDiscovered = Object.keys(state.codex).length;

          slots.push({
            id: i,
            name: `슬롯 ${i + 1}`,
            timestamp: saveData.timestamp,
            playTimeSec: saveData.playTimeSec,
            version: saveData.version,
            shells: state.shells,
            speciesDiscovered,
            shipLevel: state.shipLevel,
            title: state.title,
          });
        } catch {
          slots.push({
            id: i,
            name: `슬롯 ${i + 1} (손상됨)`,
            timestamp: 0,
            playTimeSec: 0,
            version: '?',
            shells: 0,
            speciesDiscovered: 0,
            shipLevel: 0,
            title: '',
          });
        }
      } else {
        slots.push({
          id: i,
          name: `슬롯 ${i + 1} (비어있음)`,
          timestamp: 0,
          playTimeSec: 0,
          version: '',
          shells: 0,
          speciesDiscovered: 0,
          shipLevel: 0,
          title: '',
        });
      }
    }

    return slots;
  }

  /**
   * Delete a save slot
   */
  static deleteSlot(slotId: number): boolean {
    if (slotId < 0 || slotId >= SAVE_SLOTS) return false;
    const key = SAVE_KEY_PREFIX + slotId;
    localStorage.removeItem(key);
    return true;
  }

  /**
   * Export save as string (for backup)
   */
  static exportSave(slotId: number): string | null {
    const key = SAVE_KEY_PREFIX + slotId;
    return localStorage.getItem(key);
  }

  /**
   * Import save from string
   */
  static importSave(slotId: number, data: string): { success: boolean; error?: string } {
    if (slotId < 0 || slotId >= SAVE_SLOTS) {
      return { success: false, error: 'Invalid save slot' };
    }

    try {
      const saveData: SaveData = JSON.parse(data);
      if (!saveData.version || !saveData.state) {
        return { success: false, error: 'Invalid save data format' };
      }

      const key = SAVE_KEY_PREFIX + slotId;
      localStorage.setItem(key, data);
      return { success: true };
    } catch (e) {
      return { success: false, error: `Import failed: ${e}` };
    }
  }

  /**
   * Format play time as human-readable string
   */
  static formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${secs}초`;
    }
    if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    }
    return `${secs}초`;
  }

  /**
   * Format timestamp as date string
   */
  static formatDate(timestamp: number): string {
    if (timestamp === 0) return '—';
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR');
  }
}
