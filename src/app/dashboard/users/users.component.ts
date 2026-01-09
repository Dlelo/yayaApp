import {Component, inject} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {AsyncPipe, JsonPipe} from '@angular/common';
import {UsersService} from './users.service';
import {EditUserDialogComponent} from './edit-user-dialog/edit-user-dialog.component';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';



@Component({
  selector: 'users',
  templateUrl: './users.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatDialogModule,
    MatButton,
    AsyncPipe,
    MatPaginatorModule,
  ],
  providers: [UsersService],
  standalone: true
})
export class UsersComponent{
  private readonly  usersService:UsersService = inject(UsersService);
  private dialog: MatDialog = inject(MatDialog);
  private readonly router = inject(Router);

  allRoles = ["ADMIN", "HOMEOWNER", "HOUSEHELP", "AGENT"];

  page = 0;
  size = 20;

  usersPage$!: Observable<PageResponse<User>>;


  openEditUserDialog(user: any) {
    const ref = this.dialog.open(EditUserDialogComponent, {
      width: '450px',
      data: {
        userId: user.id,
        name: user.name,
        currentRoles: user.roles?.map((r: any) => r.name || r),
        allRoles: this.allRoles
      }
    });

    ref.afterClosed().subscribe(newRoles => {
      if (newRoles) {
        this.usersService.updateUserRoles(user.id, newRoles)
          .subscribe(() => this.loadUsers());
      }
    });

  }

  openUserAccountDetails(userID:number|null){
    this.router.navigate(['/edit-account/', userID]);
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersPage$ = this.usersService.getUsers(this.page, this.size);
  }
}
