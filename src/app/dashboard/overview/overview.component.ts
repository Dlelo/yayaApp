import { Component } from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {MatListItem, MatNavList} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatCard} from '@angular/material/card';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  imports: [

    MatIconModule,
    MatCard,
    DecimalPipe,

  ]
})
export class OverviewComponent{

  totalUsers = 120;
  activeSubscriptions = 85;
  pendingRequests = 12;
  revenue = 250000;

  recentUsers = [
    { name: 'Jane Doe', email: 'jane@example.com', joined: '2025-09-20' },
    { name: 'Mary Akinyi', email: 'mary@example.com', joined: '2025-09-19' },
    { name: 'John Mwangi', email: 'john@example.com', joined: '2025-09-18' },
  ];

}
