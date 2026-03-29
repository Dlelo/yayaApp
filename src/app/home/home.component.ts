import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {

  currentYear = new Date().getFullYear();
  private readonly router: Router = inject(Router);

  navigate(path: string) {
    if (path.startsWith('/')) {
      this.router.navigate([path]);
    } else {
      this.router.navigate(['/listing', path.toLowerCase()]);
    }
  }
}
