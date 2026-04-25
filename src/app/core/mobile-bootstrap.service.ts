import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PlatformService } from './platform.service';
import { NetworkService } from './network.service';

/**
 * Native-only initialization: status bar styling, splash dismissal,
 * Android hardware back button → router navigation.
 * No-op on web.
 */
@Injectable({ providedIn: 'root' })
export class MobileBootstrapService {
  private readonly platform = inject(PlatformService);
  private readonly router = inject(Router);
  private readonly network = inject(NetworkService);

  async init(): Promise<void> {
    // Network listening works on web too — start it always.
    await this.network.start();

    // Only call native plugins on a real Capacitor shell, not the dev override.
    if (!this.platform.isRealNative()) return;

    // Lazy-load native plugins so SSR/web bundles don't pull native shims.
    const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/app'),
    ]);

    try {
      await StatusBar.setStyle({ style: Style.Dark });
      if (this.platform.isAndroid()) {
        await StatusBar.setBackgroundColor({ color: '#00ACC1' });
      }
    } catch {
      /* status bar plugin unavailable */
    }

    try {
      await SplashScreen.hide();
    } catch {
      /* splash already hidden */
    }

    // Android hardware back: pop history; exit on the app's root screens.
    const exitRoots = ['/listing', '/listing/all', '/login', '/menu'];
    App.addListener('backButton', () => {
      const url = this.router.url.split('?')[0];
      if (exitRoots.includes(url)) {
        App.exitApp();
      } else {
        history.back();
      }
    });
  }
}
