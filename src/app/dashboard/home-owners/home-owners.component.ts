import {Component, inject, OnInit} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable} from 'rxjs';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {HomeOwnerService} from './home-owners.service';
import {AsyncPipe} from '@angular/common';
import {MatDialog} from '@angular/material/dialog';
import {SecurityVerifyDialogComponent} from '../security-clearance-dialog/security-clearance-dialog.component';


@Component({
  selector: 'app-home-owners',
  templateUrl: './home-owners.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatButton,
    AsyncPipe,
    MatPaginator,
  ],
  providers: [HomeOwnerService],
  standalone: true
})
export class HomeOwnersComponent implements OnInit {
  private readonly  homeOwnerService:HomeOwnerService = inject(HomeOwnerService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private dialog: MatDialog = inject(MatDialog);

  page = 0;
  size = 20;

  homeOwnerPage$!: Observable<PageResponse<HomeOwner>>;

  ngOnInit(): void {
    this.loadHomeOwners();
  }

  loadHomeOwners(): void {
    this.homeOwnerPage$ = this.homeOwnerService.getHomeOwners(
      this.page,
      this.size,
      true
    );
  }

  activateHouseHelp(id:number|undefined, active:boolean):void{
    this.homeOwnerService.setActiveStatus(id, active).subscribe({
      next: () => {
        this.snackBar.open('✅HomeOwner updated successfully!', 'Close', {
          duration: 3000,
        });
        this.loadHomeOwners();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('❌ Failed to update homeowner. Please try again.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onHomeOwnerPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadHomeOwners();
  }

  editHomeOwner(userID:number|null){
    this.router.navigate(['/edit-account/', userID]);
  }

  securityVerify(homeOwnerId:number|undefined) {
    const ref = this.dialog.open(SecurityVerifyDialogComponent, {
      width: '450px',
      data: {
        homeOwnerId,
        type: 'HOMEOWNER'
      }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.homeOwnerService.setSecurityCleared(homeOwnerId, result.cleared, result.comments)
        .subscribe({
          next: (res) => {
            this.snackBar.open('✅Security verified successfully!', 'Close', {
              duration: 3000,
            });
          },
          error: (err) => {
           this.snackBar.open('❌ Security verification failed. Invalid credentials.', 'Close', {
              duration: 3000,
            });
          }
        });
    });
  }

}
