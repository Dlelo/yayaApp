import { Component, inject, OnInit } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { HousehelpService } from '../dashboard/house-helps/house-helps.service';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Observable, switchMap } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-listings',
  imports: [MatPaginatorModule, MatCardModule, MatButton, AsyncPipe],
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.scss'],
  providers: [HousehelpService],
})
export class ListingsComponent implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly househelpService:HousehelpService = inject(HousehelpService);
  private readonly activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  houseHelps$: Observable<{ data: any[]; length: number; pages: any }> | undefined;

  ngOnInit() {
    this.houseHelps$ = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        const type = params.get('type') || 'all';
        return this.househelpService.getAll(type.toUpperCase());
      })
    );
  }

  seeDetails(id: number) {
    this.router.navigate(['/profile', id]);
  }

  onPageChange(event: PageEvent) { console.log('Load page', event.pageIndex); }
}
