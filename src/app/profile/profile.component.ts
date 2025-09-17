import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatDivider} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [
    MatIconModule,
    MatCard,
    MatDivider
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
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
}
