import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import {DatePipe} from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-hire-requests',
  templateUrl: './hire-requests.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatListModule,
    DatePipe,
    MatButton,
  ],
  standalone: true
})
export class HireRequestsComponent {
  requests = [
    { owner: 'Jane Doe', househelp: 'Mary Akinyi', date: new Date('2025-09-20') },
    { owner: 'John Mwangi', househelp: 'Grace Wanjiku', date: new Date('2025-09-21') },
    { owner: 'Alice Otieno', househelp: 'Beatrice Njeri', date: new Date('2025-09-22') },
  ];
}
