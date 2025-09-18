import {Component, inject} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import {Router} from '@angular/router';



@Component({
  standalone: true,
  selector: 'app-listings',
  imports: [MatPaginatorModule, MatCardModule],
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.scss'],
})
export class ListingsComponent {
  private readonly router: Router = inject(Router);
  househelps = [
      {id:1, name: 'Mary', role: 'Housekeeper', photo: 'assets/mary.png', description: '5 years experience in cleaning and childcare' },
      {id:2, name: 'Grace', role: 'Cook', photo: 'assets/grace.png', description: 'Expert in Kenyan and continental dishes' },
      {id:3, name: 'Esther', role: 'Nanny', photo: 'assets/esther.png', description: 'Loving nanny with 3 years of experience' }

];

  onPageChange(event: PageEvent) {
    console.log('Load page', event.pageIndex);
  }

  seeDetails(id: number) {
    this.router.navigate(['/profile', id]);
  }
}
