// OCEAN GAIA V3.2 — Input System
// 세션 B 소유 — Three.js import 금지
// 키보드 입력을 게임 액션으로 변환

export interface InputState {
  forward: number; // -1 to 1
  turn: number; // -1 to 1
  vertical: number; // -1 to 1
  action: InputAction | null;
}

export type InputAction =
  | 'enter_water'
  | 'return_to_ship'
  | 'catch'
  | 'observe'
  | 'sell_all'
  | 'save'
  | 'load'
  | 'pause'
  | 'switch_target';

export type InputCallback = (action: InputAction) => void;

export class InputSystem {
  private keys: Set<string> = new Set();
  private actionCallbacks: InputCallback[] = [];
  private enabled: boolean = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  attach(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.keys.clear();
    }
  }

  onAction(callback: InputCallback): () => void {
    this.actionCallbacks.push(callback);
    return () => {
      const idx = this.actionCallbacks.indexOf(callback);
      if (idx >= 0) this.actionCallbacks.splice(idx, 1);
    };
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Don't capture if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    this.keys.add(e.key.toLowerCase());

    // Action keys (trigger on press)
    const action = this.getActionFromKey(e.key.toLowerCase());
    if (action) {
      e.preventDefault();
      this.triggerAction(action);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  private getActionFromKey(key: string): InputAction | null {
    switch (key) {
      case 'e': return 'enter_water';
      case 'q': return 'return_to_ship';
      case ' ': return 'catch';
      case 'f': return 'observe';
      case 'enter': return 'sell_all';
      case 's':
        if (this.keys.has('control')) return 'save';
        return null;
      case 'l':
        if (this.keys.has('control')) return 'load';
        return null;
      case 'escape': return 'pause';
      case 'tab': return 'switch_target';
      default: return null;
    }
  }

  private triggerAction(action: InputAction): void {
    for (const cb of this.actionCallbacks) {
      cb(action);
    }
  }

  /**
   * Get current continuous input state (called each frame)
   */
  getState(): InputState {
    if (!this.enabled) {
      return { forward: 0, turn: 0, vertical: 0, action: null };
    }

    let forward = 0;
    let turn = 0;
    let vertical = 0;

    // Movement
    if (this.keys.has('w') || this.keys.has('arrowup')) forward += 1;
    if (this.keys.has('s') && !this.keys.has('control')) forward -= 1;
    if (this.keys.has('arrowdown')) forward -= 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) turn -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) turn += 1;

    // Vertical (diver)
    if (this.keys.has('r') || this.keys.has('pageup')) vertical += 1;
    if (this.keys.has('f') || this.keys.has('pagedown')) vertical -= 1;

    // Normalize diagonal
    if (forward !== 0 && turn !== 0) {
      forward *= 0.707;
      turn *= 0.707;
    }

    return { forward, turn, vertical, action: null };
  }
}

// Singleton instance
export const inputSystem = new InputSystem();
