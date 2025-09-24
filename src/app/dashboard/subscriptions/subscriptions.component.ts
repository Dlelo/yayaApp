import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  imports: [
    MatCard,
    MatIconModule,
    DatePipe,
  ],
  standalone: true
})
export class SubscriptionsComponent {
  subscriptions = [
    { user: 'Jane Doe', plan: 'Premium', start: new Date(2025, 8, 1), end: new Date(2025, 8, 30), active: true },
    { user: 'John Mwangi', plan: 'Basic', start: new Date(2025, 7, 15), end: new Date(2025, 8, 15), active: false },
  ];
}
