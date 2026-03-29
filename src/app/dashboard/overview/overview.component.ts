import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HousehelpService } from '../house-helps/house-helps.service';
import { HomeOwnerService } from '../home-owners/home-owners.service';
import { HireRequestsService } from '../hire-requests/hire-requests.service';

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  imports: [MatIconModule, DecimalPipe, RouterLink],
  providers: [HousehelpService, HomeOwnerService, HireRequestsService],
})
export class OverviewComponent implements OnInit {
  private househelpService = inject(HousehelpService);
  private homeOwnerService = inject(HomeOwnerService);
  private hireRequestsService = inject(HireRequestsService);

  totalHouseHelps = signal(0);
  totalHomeOwners = signal(0);
  pendingRequests = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    forkJoin({
      houseHelps: this.househelpService.getHouseHelps(0, 1, null),
      homeOwners: this.homeOwnerService.getHomeOwners(0, 1, null),
      requests: this.hireRequestsService.getHireRequests(0, 1),
    }).subscribe({
      next: (res) => {
        this.totalHouseHelps.set(res.houseHelps.totalElements);
        this.totalHomeOwners.set(res.homeOwners.totalElements);
        this.pendingRequests.set(res.requests.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  stats = [
    {
      key: 'houseHelps',
      label: 'House Helps',
      icon: 'home',
      color: 'cyan',
      description: 'Registered domestic staff',
    },
    {
      key: 'homeOwners',
      label: 'Home Owners',
      icon: 'house',
      color: 'green',
      description: 'Families on the platform',
    },
    {
      key: 'requests',
      label: 'Hire Requests',
      icon: 'assignment',
      color: 'orange',
      description: 'Total hire requests made',
    },
  ];

  getStatValue(key: string): number {
    if (key === 'houseHelps') return this.totalHouseHelps();
    if (key === 'homeOwners') return this.totalHomeOwners();
    if (key === 'requests') return this.pendingRequests();
    return 0;
  }
}
