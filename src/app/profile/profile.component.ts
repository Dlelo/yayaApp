import {Component, inject} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatDivider} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [
    MatIconModule,
    MatCard,
    MatDivider,
    MatButton
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  private readonly router:Router = inject(Router);
  houseHelp = {
    name: 'Mary Akinyi',
    role: 'Housekeeper',
    photo: '/househelp-banner.png',
    description: 'Mary is a reliable housekeeper with 5 years of experience in managing households, cooking, and childcare.',
    skills: ['Cleaning', 'Cooking', 'Childcare', 'Laundry'],
    experience: 5,
    phone: '+254 712 345678',
    email: 'mary@example.com'
  };

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
