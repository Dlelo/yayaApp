import {Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {HousehelpService} from './house-helps.service';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SecurityVerifyDialogComponent} from '../security-clearance-dialog/security-clearance-dialog.component';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatOptionModule} from '@angular/material/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-house-helps',
  templateUrl: './house-helps.component.html',
  styleUrls: ['./house-helps.component.scss'],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    MatOptionModule,
    FormsModule,
  ],
  providers: [HousehelpService],
  standalone: true
})
export class HouseHelpsComponent implements OnInit {
  private readonly househelpService: HousehelpService = inject(HousehelpService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('assignAgentDialog') assignAgentDialogRef!: TemplateRef<any>;

  page = 0;
  size = 20;
  loading = true;
  shimmerRows = [1, 2, 3, 4, 5];

  houseHelpsPage: PageResponse<HouseHelp> | null = null;

  agents: any[] = [];
  selectedAgentId: number | null = null;
  private currentAssignHouseHelpId: number | null = null;

  ngOnInit(): void {
    this.loadHouseHelps();
  }

  loadHouseHelps(): void {
    this.loading = true;
    this.househelpService.getHouseHelps(this.page, this.size, null).subscribe({
      next: (data) => {
        this.houseHelpsPage = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.houseHelpsPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true };
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  activateHouseHelp(id: number, active: boolean): void {
    this.househelpService.setActiveStatus(id, active).subscribe({
      next: () => {
        this.snackBar.open('House help updated successfully!', 'Close', { duration: 3000 });
        this.loadHouseHelps();
      },
      error: () => {
        this.snackBar.open('Failed to update house help.', 'Close', { duration: 3000 });
      },
    });
  }

  markAsHired(houseHelpId: number, currentStatus: string): void {
    const newStatus = currentStatus === 'HIRED' ? 'AVAILABLE' : 'HIRED';
    this.househelpService.updateHiringStatus(houseHelpId, newStatus).subscribe({
      next: () => {
        this.snackBar.open(`House help marked as ${newStatus.toLowerCase()}!`, 'Close', { duration: 3000 });
        this.loadHouseHelps();
      },
      error: () => {
        this.snackBar.open('Failed to update hiring status.', 'Close', { duration: 3000 });
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
      data: { houseHelpId, type: 'HOUSEHELP' }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.househelpService.setSecurityCleared(houseHelpId, result.cleared, result.comments).subscribe({
        next: () => {
          this.snackBar.open('Security verified successfully!', 'Close', { duration: 3000 });
          this.loadHouseHelps();
        },
        error: () => {
          this.snackBar.open('Security verification failed.', 'Close', { duration: 3000 });
        }
      });
    });
  }

  openAssignAgentDialog(houseHelpId: number): void {
    this.currentAssignHouseHelpId = houseHelpId;
    this.selectedAgentId = null;
    this.househelpService.getAgents().subscribe({
      next: (data) => {
        this.agents = data.content ?? data;
        this.dialog.open(this.assignAgentDialogRef, { width: '400px' });
      },
      error: () => {
        this.snackBar.open('Failed to load agents.', 'Close', { duration: 3000 });
      }
    });
  }

  confirmAssignAgent(): void {
    if (!this.currentAssignHouseHelpId || !this.selectedAgentId) return;
    this.househelpService.assignToAgent(this.currentAssignHouseHelpId, this.selectedAgentId).subscribe({
      next: () => {
        this.snackBar.open('Agent assigned successfully!', 'Close', { duration: 3000 });
        this.dialog.closeAll();
        this.loadHouseHelps();
      },
      error: () => {
        this.snackBar.open('Failed to assign agent.', 'Close', { duration: 3000 });
      }
    });
  }
}
