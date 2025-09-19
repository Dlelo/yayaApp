import {Component, inject} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  private readonly router:Router = inject(Router);
  recentHousehelps = [
    { name: 'Mary', role: 'Housekeeper' },
    { name: 'Grace', role: 'Cook' },
    { name: 'Esther', role: 'Nanny' },
  ];

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
