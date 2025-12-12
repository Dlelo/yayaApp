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

  currentYear = new Date().getFullYear();
  private readonly router:Router = inject(Router);

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
