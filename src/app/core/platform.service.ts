import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

const FORCE_KEY = 'forceNativeUI';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly forced = this.detectForced();

  /**
   * True when running in a real Capacitor shell, OR when the dev override is on
   * (`?native=1` or `?native=ios` / `?native=android` in the URL, which is then
   * sticky in localStorage; turn off with `?native=0`). Use this for UI gating
   * (bottom tab bar, mobile menu, status-bar padding, etc.).
   */
  isNative(): boolean {
    if (this.forced) return true;
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  /** Real-shell check — used internally to decide whether to call native APIs. */
  isRealNative(): boolean {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  platform(): 'ios' | 'android' | 'web' {
    if (this.forced && this.forced !== 'on') return this.forced;
    try {
      return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    } catch {
      return 'web';
    }
  }

  isIos(): boolean {
    return this.platform() === 'ios';
  }

  isAndroid(): boolean {
    return this.platform() === 'android';
  }

  /** Dev override: returns false unless explicitly forced. */
  private detectForced(): 'on' | 'ios' | 'android' | false {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('native');
      if (q === '0' || q === 'off' || q === 'false') {
        localStorage.removeItem(FORCE_KEY);
        return false;
      }
      if (q === '1' || q === 'true' || q === 'on') {
        localStorage.setItem(FORCE_KEY, 'on');
        return 'on';
      }
      if (q === 'ios' || q === 'android') {
        localStorage.setItem(FORCE_KEY, q);
        return q;
      }
      const stored = localStorage.getItem(FORCE_KEY);
      if (stored === 'ios' || stored === 'android') return stored;
      if (stored === 'on') return 'on';
    } catch {
      /* localStorage blocked */
    }
    return false;
  }
}
