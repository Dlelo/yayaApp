import {Component, inject, OnInit} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {HousehelpService} from './house-helps.service';
import {AsyncPipe} from '@angular/common';
import {Observable} from 'rxjs';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {Router} from '@angular/router';


@Component({
  selector: 'app-house-helps',
  templateUrl: './house-helps.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatButton,
    AsyncPipe,
    MatPaginatorModule,
  ],
  providers: [HousehelpService],
  standalone: true
})
export class HouseHelpsComponent implements OnInit{
  private readonly  househelpService:HousehelpService = inject(HousehelpService);
  private readonly router = inject(Router);

  page = 0;
  size = 20;

  houseHelpsPage$!: Observable<PageResponse<HouseHelp>>;

  ngOnInit(): void {
    this.loadHouseHelps();
  }

  loadHouseHelps(): void {
    this.houseHelpsPage$ = this.househelpService.getHouseHelps(
      this.page,
      this.size
    );
  }

  onHouseHelpPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadHouseHelps();
  }

  activateDeactivate(userID:number|null){
       console.log(userID);
  }

  editHouseHelp(userID:number|null){
    this.router.navigate(['/edit-account/', userID]);
  }

}
