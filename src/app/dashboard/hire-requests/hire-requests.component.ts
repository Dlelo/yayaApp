import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { HireRequestsService } from './hire-requests.service';

@Component({
  selector: 'app-hire-requests',
  templateUrl: './hire-requests.component.html',
  styleUrls: ['./hire-requests.component.scss'],
  imports: [
    MatIconModule,
    MatDialogModule,
    MatButton,
    DatePipe,
    TitleCasePipe,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
  ],
  providers: [HireRequestsService],
  standalone: true
})
export class HireRequestsComponent implements OnInit {
  private readonly hireRequestsService = inject(HireRequestsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  page = 0;
  size = 20;
  isLoading = true;
  hasError = false;
  shimmerRows = [1, 2, 3, 4, 5];

  selectedStatus: string = '';
  selectedPayment: string = '';

  hireRequestsPage: PageResponse<HireRequest> | null = null;

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  paymentOptions = [
    { value: '', label: 'All Payments' },
    { value: 'true', label: 'Paid' },
    { value: 'false', label: 'Unpaid' },
  ];

  ngOnInit(): void {
    this.loadHireRequests();
  }

  loadHireRequests(): void {
    this.isLoading = true;
    this.hasError = false;

    const filter: any = {};
    if (this.selectedStatus) filter.status = this.selectedStatus;
    if (this.selectedPayment !== '') filter.paid = this.selectedPayment;

    this.hireRequestsService.getHireRequests(this.page, this.size, filter).subscribe({
      next: (data) => {
        this.hireRequestsPage = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.hasError = true;
        this.hireRequestsPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true };
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadHireRequests();
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadHireRequests();
  }

  updateStatus(id: number, status: string): void {
    this.hireRequestsService.updateStatus(id, status).subscribe({
      next: () => {
        this.snackBar.open(`Request ${status.toLowerCase()} successfully!`, 'Close', { duration: 3000 });
        this.loadHireRequests();
      },
      error: () => {
        this.snackBar.open('Failed to update request. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  viewRequest(id: number): void {
    this.router.navigate(['/hire-requests', id]);
  }
}
