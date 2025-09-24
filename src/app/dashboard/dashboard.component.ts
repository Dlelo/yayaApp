import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';

import {RouterLink} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    MatCard,
    MatSidenavContent,
    MatIconModule,
    RouterLink,
    MatSidenav,
    MatSidenavContainer
  ],
  standalone: true
})
export class DashboardComponent {
  totalUsers = 145;
  activeSubscriptions = 78;
  pendingRequests = 12;
  revenue = 54000;

  recentUsers = [
    { name: 'John Doe', email: 'john@example.com', joined: '2025-09-01' },
    { name: 'Jane Smith', email: 'jane@example.com', joined: '2025-09-10' },
    { name: 'Mark Joe', email: 'mark@example.com', joined: '2025-09-20' }
  ];

  // Navigation links
  navLinks = [
    { path: '/admin/users', label: 'Users', icon: 'group' },
    { path: '/admin/subscriptions', label: 'Subscriptions', icon: 'card_membership' },
    { path: '/admin/requests', label: 'Requests', icon: 'assignment' },
    { path: '/admin/reports', label: 'Reports', icon: 'bar_chart' }
  ];
}
