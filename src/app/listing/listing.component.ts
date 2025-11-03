import {Component, inject} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import {Router} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {HousehelpService} from '../dashboard/house-helps/house-helps.service';
import {AsyncPipe} from '@angular/common';



@Component({
  standalone: true,
  selector: 'app-listings',
  imports: [MatPaginatorModule, MatCardModule, MatButton, AsyncPipe],
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.scss'],
  providers: [HousehelpService],
})
export class ListingsComponent {
  private readonly router: Router = inject(Router);
  private readonly  househelpService = inject(HousehelpService);

  houseHelps = this.househelpService.getAll();

  onPageChange(event: PageEvent) {
    console.log('Load page', event.pageIndex);
  }

  seeDetails(id: number) {
    this.router.navigate(['/profile', id]);
  }
}
