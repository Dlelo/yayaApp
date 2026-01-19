// import { Component } from '@angular/core';
// import {MatCard} from '@angular/material/card';
// import {MatIconModule} from '@angular/material/icon';
// import { MatListModule } from '@angular/material/list';
// import {DatePipe} from '@angular/common';
// import {MatButton} from '@angular/material/button';

// @Component({
//   selector: 'app-hire-requests',
//   templateUrl: './hire-requests.component.html',
//   imports: [
//     MatCard,
//     MatIconModule,
//     MatListModule,
//     DatePipe,
//     MatButton,
//   ],
//   standalone: true
// })
// export class HireRequestsComponent {
//   requests = [
//     { owner: 'Jane Doe', househelp: 'Mary Akinyi', date: new Date('2025-09-20') },
//     { owner: 'John Mwangi', househelp: 'Grace Wanjiku', date: new Date('2025-09-21') },
//     { owner: 'Alice Otieno', househelp: 'Beatrice Njeri', date: new Date('2025-09-22') },
//   ];
// }

import {Component, inject, OnInit} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {AsyncPipe, JsonPipe} from '@angular/common';
// import {UsersService} from './users.service';
// import {EditUserDialogComponent} from './edit-user-dialog/edit-user-dialog.component';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
// import {LoginService} from '../../login/login.service';
import {DatePipe} from '@angular/common';
import {HireRequestsService} from './hire-requests.service';



@Component({
  selector: 'app-hire-requests',
  templateUrl: './hire-requests.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatDialogModule,
    MatButton,
    DatePipe,
    AsyncPipe,
    MatPaginatorModule,
  ],
  providers: [HireRequestsService],
  standalone: true
})
export class HireRequestsComponent implements OnInit{
  private readonly  hireRequestsService:HireRequestsService = inject(HireRequestsService);
  private dialog: MatDialog = inject(MatDialog);
  private readonly router:Router = inject(Router);
  // private readonly loginService = inject(LoginService);

  // allRoles = ["ADMIN", "HOMEOWNER", "HOUSEHELP", "AGENT",'SALES','SECURITY'];

  page = 0;
  size = 20;

  hireRequestsPage$!: Observable<PageResponse<HireRequest>>;

  // roles = this.loginService.userRoles;


  // openEditUserDialog(user: any) {
  //   const ref = this.dialog.open(EditUserDialogComponent, {
  //     width: '450px',
  //     data: {
  //       userId: user.id,
  //       name: user.name,
  //       currentRoles: user.roles?.map((r: any) => r.name || r),
  //       allRoles: this.allRoles
  //     }
  //   });

  //   ref.afterClosed().subscribe(newRoles => {
  //     if (newRoles) {
  //       this.usersService.updateUserRoles(user.id, newRoles)
  //         .subscribe(() => this.loadUsers());
  //     }
  //   });

  // }

  // openUserAccountDetails(userID:number|null){
  //   this.router.navigate(['/edit-account/', userID]);
  // }

  // openViewUserDetails(userID:number|null){
  //   this.router.navigate(['/account/', userID]);
  // }

  ngOnInit(): void {
    this.loadHireRequests();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadHireRequests();
  }

  loadHireRequests(): void {
    const res = this.hireRequestsService.getHireRequests(this.page, this.size);
    console.log('Hire Requests Response:');
    console.log(res)
    this.hireRequestsPage$ = res;
  }
}

