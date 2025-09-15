import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [MatCardModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
