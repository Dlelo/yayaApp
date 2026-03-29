import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, catchError, of } from 'rxjs';
import { StatsService, DashboardStats } from '../overview/stats.service';
import { PaymentService } from '../payments/payments-list.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  imports: [CurrencyPipe, DecimalPipe, MatIconModule],
  providers: [StatsService],
  standalone: true,
})
export class ReportsComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly paymentService = inject(PaymentService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  stats: DashboardStats | null = null;
  totalPayments = 0;

  ngOnInit(): void {
    forkJoin({
      stats: this.statsService.getStats().pipe(catchError(() => of(null))),
      payments: this.paymentService.getPayments(0, 1).pipe(catchError(() => of({ totalElements: 0 } as any))),
    }).subscribe({
      next: ({ stats, payments }) => {
        this.stats = stats;
        this.totalPayments = payments?.totalElements ?? 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get rejectedHires(): number {
    if (!this.stats) return 0;
    return Math.max(0, this.stats.totalHireRequests - this.stats.acceptedHireRequests - this.stats.pendingHireRequests);
  }

  get failedPayments(): number {
    return Math.max(0, this.totalPayments - (this.stats?.successfulPayments ?? 0) - (this.stats?.pendingPayments ?? 0));
  }

  get hireSuccessRate(): number {
    if (!this.stats?.totalHireRequests) return 0;
    return Math.round((this.stats.acceptedHireRequests / this.stats.totalHireRequests) * 100);
  }

  get paymentSuccessRate(): number {
    if (!this.totalPayments) return 0;
    return Math.round(((this.stats?.successfulPayments ?? 0) / this.totalPayments) * 100);
  }

  pct(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
  }

  get hireDonutBg(): string {
    const total = this.stats?.totalHireRequests || 1;
    const a = this.pct(this.stats?.acceptedHireRequests ?? 0, total);
    const p = this.pct(this.stats?.pendingHireRequests ?? 0, total);
    const ap = Math.min(a + p, 100);
    return `conic-gradient(#059669 0% ${a}%, #f97316 ${a}% ${ap}%, #ef4444 ${ap}% 100%)`;
  }

  get paymentDonutBg(): string {
    const total = this.totalPayments || 1;
    const s = this.pct(this.stats?.successfulPayments ?? 0, total);
    const p = this.pct(this.stats?.pendingPayments ?? 0, total);
    const sp = Math.min(s + p, 100);
    return `conic-gradient(#059669 0% ${s}%, #f97316 ${s}% ${sp}%, #ef4444 ${sp}% 100%)`;
  }

  get revenueMonthPct(): number {
    return this.pct(this.stats?.revenueThisMonth ?? 0, this.stats?.totalRevenue || 1);
  }

  get revenueWeekPct(): number {
    return this.pct(this.stats?.revenueThisWeek ?? 0, this.stats?.revenueThisMonth || 1);
  }

  get userGrowthRows(): { label: string; week: number; month: number; icon: string; color: string }[] {
    if (!this.stats) return [];
    return [
      { label: 'Users', week: this.stats.usersThisWeek, month: this.stats.usersThisMonth, icon: 'person', color: '#3b82f6' },
      { label: 'House Helps', week: 0, month: this.stats.houseHelpsThisMonth, icon: 'cleaning_services', color: '#059669' },
      { label: 'Home Owners', week: 0, month: this.stats.homeOwnersThisMonth, icon: 'home', color: '#00acc1' },
    ];
  }

  maxGrowth(): number {
    const rows = this.userGrowthRows;
    return Math.max(1, ...rows.map(r => Math.max(r.week, r.month)));
  }
}
