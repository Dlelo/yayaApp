import { Injectable, inject, signal } from '@angular/core';
import { PlatformService } from './platform.service';

/**
 * Tracks online/offline state. Uses @capacitor/network on native and
 * window online/offline events on the web. Exposes a signal for templates.
 */
@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly platform = inject(PlatformService);
  private readonly online$ = signal(true);
  private started = false;

  readonly online = this.online$.asReadonly();

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    if (this.platform.isRealNative()) {
      try {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        this.online$.set(status.connected);
        Network.addListener('networkStatusChange', (s) => this.online$.set(s.connected));
        return;
      } catch {
        /* fall through to browser events */
      }
    }

    if (typeof window !== 'undefined') {
      this.online$.set(navigator.onLine);
      window.addEventListener('online', () => this.online$.set(true));
      window.addEventListener('offline', () => this.online$.set(false));
    }
  }
}
