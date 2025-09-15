import { Component } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-listings',
  imports: [MatPaginatorModule, MatCardModule],
  templateUrl: './listing.component.html',
})
export class ListingsComponent {
  househelps = [
    { name: 'Mary Akinyi' },
    { name: 'Jane Wanjiru' },
  ];

  onPageChange(event: PageEvent) {
    console.log('Load page', event.pageIndex);
  }
}
