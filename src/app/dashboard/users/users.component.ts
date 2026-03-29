import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {UsersService} from './users.service';
import {EditUserDialogComponent} from './edit-user-dialog/edit-user-dialog.component';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {LoginService} from '../../login/login.service';
import {inject} from '@angular/core';



@Component({
  selector: 'users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  imports: [
    MatIconModule,
    MatDialogModule,
    MatButton,
    MatPaginatorModule,
  ],
  providers: [UsersService],
  standalone: true
})
export class UsersComponent implements OnInit {
  private readonly usersService: UsersService = inject(UsersService);
  private dialog: MatDialog = inject(MatDialog);
  private readonly router: Router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly cdr = inject(ChangeDetectorRef);

  allRoles = ["ADMIN", "HOMEOWNER", "HOUSEHELP", "AGENT", 'SALES', 'SECURITY'];

  page = 0;
  size = 20;
  loading = true;
  shimmerRows = [1, 2, 3, 4, 5];

  usersPage: PageResponse<User> | null = null;

  roles = this.loginService.userRoles;

  openEditUserDialog(user: any) {
    const ref = this.dialog.open(EditUserDialogComponent, {
      width: '450px',
      data: {
        userId: user.id,
        name: user.name,
        currentRoles: user.roles ?? [],
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

  openUserAccountDetails(userID: number | null) {
    this.router.navigate(['/edit-account/', userID]);
  }

  openViewUserDetails(userID: number | null) {
    this.router.navigate(['/account/', userID]);
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
    this.loading = true;
    this.usersService.getUsers(this.page, this.size).subscribe({
      next: (data) => {
        this.usersPage = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usersPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true };
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
