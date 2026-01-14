import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HousehelpService } from '../dashboard/house-helps/house-helps.service';
import { Observable } from 'rxjs';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {FormsModule} from '@angular/forms';
import {MatCard, MatCardActions, MatCardContent} from '@angular/material/card';
import {AsyncPipe} from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-listings',
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.scss'],
  providers: [HousehelpService],
  imports: [
    FormsModule,
    MatCard,
    AsyncPipe,
    MatCardContent,
    MatCardActions,
    MatButton,
    MatPaginator
  ]
})
export class ListingsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private househelpService = inject(HousehelpService);

  houseHelps$!: Observable<any>;

  page:number = 0;
  size:number = 20;
  type:string = 'ALL';

  filters: any = {
    active: true,
    houseHelpType: null,
    experience: null,
    minExpectedSalary: null,
    maxExpectedSalary: null,
    location: null,
    languages: null,
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.type = (params.get('type') || 'all').toUpperCase();
      this.filters.houseHelpType = this.type === 'ALL' ? null : this.type;
      this.load(this.type);
    });
  }

  load(type:string) {
    this.houseHelps$ = this.househelpService.getAll(
      type,
      this.page,
      this.size,
      this.filters
    );
  }

  applyFilters() {
    this.page = 0;
    this.load(this.type);
  }

  clearFilters() {
    this.filters = {
      active: true,
      houseHelpType: this.filters.houseHelpType,
    };
    this.load(this.type);
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.load(this.type);
  }

  seeDetails(id: number) {
    this.router.navigate(['/profile', id]);
  }
}
