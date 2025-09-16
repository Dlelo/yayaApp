import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  recentHousehelps = [
    { name: 'Mary', role: 'Housekeeper' },
    { name: 'Grace', role: 'Cook' },
    { name: 'Esther', role: 'Nanny' },
  ];
}
