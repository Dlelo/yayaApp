import { Injectable, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PlatformService } from './platform.service';

/**
 * Unified key/value storage that works in browsers and Capacitor native shells.
 * - On native, persists via @capacitor/preferences (secure platform storage).
 * - On web, persists via localStorage.
 * Reads are sync against an in-memory cache that is hydrated once on init().
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platform = inject(PlatformService);
  private cache = new Map<string, string>();
  private hydrated = false;
  private hydrating: Promise<void> | null = null;

  /** Keys to load into the cache at boot. */
  private readonly trackedKeys = ['authToken', 'user'];

  init(): Promise<void> {
    if (this.hydrated) return Promise.resolve();
    if (this.hydrating) return this.hydrating;

    this.hydrating = this.hydrate();
    return this.hydrating;
  }

  private async hydrate(): Promise<void> {
    if (this.platform.isRealNative()) {
      for (const key of this.trackedKeys) {
        const { value } = await Preferences.get({ key });
        if (value != null) this.cache.set(key, value);
      }
    } else if (typeof localStorage !== 'undefined') {
      for (const key of this.trackedKeys) {
        const value = localStorage.getItem(key);
        if (value != null) this.cache.set(key, value);
      }
    }
    this.hydrated = true;
  }

  get(key: string): string | null {
    return this.cache.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.cache.set(key, value);
    if (this.platform.isRealNative()) {
      void Preferences.set({ key, value });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  remove(key: string): void {
    this.cache.delete(key);
    if (this.platform.isRealNative()) {
      void Preferences.remove({ key });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}
