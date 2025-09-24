import { Component } from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import {MatCard} from '@angular/material/card';
import {DecimalPipe} from '@angular/common';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {MatNavList} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    RouterOutlet,
    MatCard,
    DecimalPipe,
    MatSidenavContent,
    RouterLink,
    MatIconModule,
    MatNavList,
    MatSidenav,
    MatSidenavContainer
  ]
})
export class DashboardComponent {
  navLinks = [
    { path: 'agents', label: 'Agents', icon: 'group' },
    { path: 'houseHelps', label: 'House Helps', icon: 'home' },
    { path: 'homeOwners', label: 'Home Owners', icon: 'person' },
    { path: 'subscriptions', label: 'Subscriptions', icon: 'card_membership' },
    { path: 'requests', label: 'Requests', icon: 'assignment' },
    { path: 'reports', label: 'Reports', icon: 'bar_chart' },
  ];

  totalUsers = 120;
  activeSubscriptions = 85;
  pendingRequests = 12;
  revenue = 250000;

  recentUsers = [
    { name: 'Jane Doe', email: 'jane@example.com', joined: '2025-09-20' },
    { name: 'Mary Akinyi', email: 'mary@example.com', joined: '2025-09-19' },
    { name: 'John Mwangi', email: 'john@example.com', joined: '2025-09-18' },
  ];

  constructor(private router: Router) {}

  get isDashboardHome(): boolean {
    return this.router.url === '/dashboard';
  }
}
