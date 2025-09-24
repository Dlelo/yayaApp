import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatList, MatListItem} from '@angular/material/list';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-hire-requests',
  templateUrl: './hire-requests.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatListItem,
    MatList,
    DatePipe,
  ],
  standalone: true
})
export class HireRequestsComponent {
  requests = [
    { owner: 'Jane Doe', househelp: 'Mary Akinyi', date: new Date(2025, 8, 22) },
    { owner: 'David Otieno', househelp: 'Lucy Wanjiru', date: new Date(2025, 8, 20) },
  ];
}
