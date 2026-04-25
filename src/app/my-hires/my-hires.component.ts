import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  HireRequestResponse,
  HireRequestService,
  HireStatus,
} from '../hire-request/hire-request.service';
import { LoginService } from '../login/login.service';
import { ShareService } from '../core/share.service';
import { catchError, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-my-hires',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './my-hires.component.html',
  styleUrls: ['./my-hires.component.scss'],
})
export class MyHiresComponent implements OnInit {
  private readonly hireService = inject(HireRequestService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly shareService = inject(ShareService);
  private readonly snack = inject(MatSnackBar);

  loading = signal(true);
  refreshing = signal(false);
  error = signal<string | null>(null);
  hires = signal<HireRequestResponse[]>([]);
  private homeOwnerId: number | null = null;

  empty = computed(() => !this.loading() && this.hires().length === 0 && !this.error());

  ngOnInit(): void {
    const userId = this.loginService.userId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.hireService
      .resolveHomeOwnerId(userId)
      .pipe(
        switchMap((homeOwnerId) => {
          this.homeOwnerId = homeOwnerId;
          return this.hireService.forHomeOwner(homeOwnerId);
        }),
        catchError((err) => {
          this.error.set(
            err?.message || 'Could not load your hire history. Please try again later.'
          );
          return of([] as HireRequestResponse[]);
        })
      )
      .subscribe((list) => {
        this.applyList(list);
        this.loading.set(false);
      });
  }

  refresh(): void {
    if (this.refreshing() || !this.homeOwnerId) return;
    this.refreshing.set(true);
    this.error.set(null);
    this.hireService
      .forHomeOwner(this.homeOwnerId)
      .pipe(
        catchError((err) => {
          this.error.set(err?.message || 'Refresh failed.');
          return of(this.hires());
        })
      )
      .subscribe((list) => {
        this.applyList(list);
        this.refreshing.set(false);
      });
  }

  private applyList(list: HireRequestResponse[]): void {
    this.hires.set(
      [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  }

  canReview(status: HireStatus): boolean {
    return status === 'ACCEPTED' || status === 'COMPLETED';
  }

  canCall(status: HireStatus): boolean {
    return status === 'ACCEPTED' || status === 'COMPLETED';
  }

  statusClass(status: HireStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  trackById(_: number, h: HireRequestResponse): number {
    return h.id;
  }

  goFindHelp(): void {
    this.router.navigate(['/listing']);
  }

  call(hire: HireRequestResponse): void {
    this.hireService.getHouseHelpPhone(hire.houseHelpId).subscribe({
      next: (phone) => {
        if (!phone) {
          this.snack.open('Phone number not available.', 'Close', { duration: 3000 });
          return;
        }
        const tel = `tel:${phone.replace(/\s+/g, '')}`;
        if (typeof window !== 'undefined') {
          window.location.href = tel;
        }
      },
      error: () => this.snack.open('Could not look up phone.', 'Close', { duration: 3000 }),
    });
  }

  async share(hire: HireRequestResponse): Promise<void> {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://yayaconnectapp.com';
    const url = `${origin}/profile/${hire.houseHelpId}`;
    const result = await this.shareService.share({
      title: `${hire.houseHelpName} on yayaConnect`,
      text: `Check out ${hire.houseHelpName}'s profile on yayaConnect.`,
      url,
      dialogTitle: 'Share house help',
    });
    if (result === 'clipboard') {
      this.snack.open('Link copied to clipboard.', 'OK', { duration: 2500 });
    } else if (result === 'unsupported') {
      this.snack.open('Sharing is not supported on this device.', 'Close', { duration: 3000 });
    }
  }
}
