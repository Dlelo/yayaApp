import {Component, inject, OnInit} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {HousehelpService} from './house-helps.service';
import {AsyncPipe} from '@angular/common';
import {Observable} from 'rxjs';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SecurityVerifyDialogComponent} from '../security-clearance-dialog/security-clearance-dialog.component';
import {MatDialog} from '@angular/material/dialog';


@Component({
  selector: 'app-house-helps',
  templateUrl: './house-helps.component.html',
  styleUrls: ['./house-helps.component.scss'],
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
  private readonly househelpService: HousehelpService = inject(HousehelpService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private dialog: MatDialog = inject(MatDialog);

  page = 0;
  size = 20;

  houseHelpsPage$!: Observable<PageResponse<HouseHelp>>;

  ngOnInit(): void {
    this.loadHouseHelps();
  }

  loadHouseHelps(): void {
    this.houseHelpsPage$ = this.househelpService.getHouseHelps(
      this.page,
      this.size,
      null
    );
  }


  activateHouseHelp(id: number, active: boolean): void {
    this.househelpService.setActiveStatus(id, active).subscribe({
      next: () => {
        this.snackBar.open('✅ House help updated successfully!', 'Close', {
          duration: 3000,
        });
        this.loadHouseHelps();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('❌ Failed to update House help. Please try again.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  markAsHired(houseHelpId: number, currentStatus: string): void {
    console.log(`Current status: ${currentStatus}`);
    const newStatus = currentStatus === 'HIRED' ? 'AVAILABLE' : 'HIRED';
    
    this.househelpService.updateHiringStatus(houseHelpId, newStatus).subscribe({
      next: () => {
        this.snackBar.open(
          `✅ House help marked as ${newStatus.toLowerCase()}!`,
          'Close',
          { duration: 3000 }
        );
        this.loadHouseHelps();
      },
      error: (error: any) => {
        console.error('Error updating hiring status:', error);
        this.snackBar.open(
          '❌ Failed to update hiring status. Please try again.',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  onHouseHelpPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadHouseHelps();
  }

  editHouseHelp(userID: number | null) {
    this.router.navigate(['/edit-account/', userID]);
  }

  securityVerify(houseHelpId: number | undefined) {
    const ref = this.dialog.open(SecurityVerifyDialogComponent, {
      width: '450px',
      data: {
        houseHelpId,
        type: 'HOUSEHELP'
      }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.househelpService.setSecurityCleared(houseHelpId, result.cleared, result.comments)
        .subscribe({
          next: (res) => {
            this.snackBar.open('✅ Security verified successfully!', 'Close', {
              duration: 3000,
            });
            this.loadHouseHelps();
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
