import { Injectable, inject } from '@angular/core';
import { PlatformService } from './platform.service';

/**
 * Thin wrapper around @capacitor/haptics. No-op on web.
 * Lazy-imports the plugin so the web bundle doesn't pull native shims.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  private readonly platform = inject(PlatformService);

  async success(): Promise<void> {
    await this.notify('Success');
  }

  async warning(): Promise<void> {
    await this.notify('Warning');
  }

  async error(): Promise<void> {
    await this.notify('Error');
  }

  async impact(style: 'Light' | 'Medium' | 'Heavy' = 'Light'): Promise<void> {
    if (!this.platform.isRealNative()) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const map = {
        Light: ImpactStyle.Light,
        Medium: ImpactStyle.Medium,
        Heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: map[style] });
    } catch {
      /* haptics not available */
    }
  }

  private async notify(type: 'Success' | 'Warning' | 'Error'): Promise<void> {
    if (!this.platform.isRealNative()) return;
    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      const map = {
        Success: NotificationType.Success,
        Warning: NotificationType.Warning,
        Error: NotificationType.Error,
      };
      await Haptics.notification({ type: map[type] });
    } catch {
      /* haptics not available */
    }
  }
}
