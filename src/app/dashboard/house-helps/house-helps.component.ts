import {Component, inject} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {HousehelpService} from './house-helps.service';
import {AsyncPipe, JsonPipe} from '@angular/common';


@Component({
  selector: 'app-house-helps',
  templateUrl: './house-helps.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatButton,
    AsyncPipe,
  ],
  standalone: true
})
export class HouseHelpsComponent {
  private readonly  househelpService = inject(HousehelpService);

  houseHelps = this.househelpService.getAll();
}
