import { Injectable, inject } from '@angular/core';
import { PlatformService } from './platform.service';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * Cross-platform sharing:
 *   1. @capacitor/share on native
 *   2. navigator.share (Web Share API) where supported (e.g. Safari, Chrome on mobile)
 *   3. Clipboard fallback otherwise
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  private readonly platform = inject(PlatformService);

  async share(opts: ShareOptions): Promise<'native' | 'web' | 'clipboard' | 'unsupported'> {
    if (this.platform.isRealNative()) {
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share(opts);
        return 'native';
      } catch {
        /* fall through to web */
      }
    }

    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (nav?.share) {
      try {
        await nav.share({ title: opts.title, text: opts.text, url: opts.url });
        return 'web';
      } catch {
        /* user cancelled or share failed */
      }
    }

    if (nav?.clipboard?.writeText && opts.url) {
      try {
        await nav.clipboard.writeText(opts.url);
        return 'clipboard';
      } catch {
        /* clipboard blocked */
      }
    }

    return 'unsupported';
  }
}
