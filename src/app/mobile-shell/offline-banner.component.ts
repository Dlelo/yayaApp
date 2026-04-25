import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NetworkService } from '../core/network.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (visible()) {
      <div class="offline-banner" role="status" aria-live="polite">
        <mat-icon>cloud_off</mat-icon>
        <span>You're offline. Some actions will retry when you reconnect.</span>
      </div>
    }
  `,
  styles: [
    `
      .offline-banner {
        position: fixed;
        top: env(safe-area-inset-top, 0);
        left: 0;
        right: 0;
        z-index: 1100;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #c62828;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class OfflineBannerComponent {
  private readonly network = inject(NetworkService);
  readonly visible = computed(() => !this.network.online());
}
