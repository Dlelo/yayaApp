import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatsService, DashboardStats } from './stats.service';

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  imports: [MatIconModule, DecimalPipe, RouterLink],
  providers: [StatsService],
})
export class OverviewComponent implements OnInit {
  private statsService = inject(StatsService);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  get hiresAcceptedRate(): number {
    const s = this.stats();
    if (!s || !s.totalHireRequests) return 0;
    return Math.round((s.acceptedHireRequests / s.totalHireRequests) * 100);
  }
}
