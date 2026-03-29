import { Component, inject, OnInit } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, catchError, of, shareReplay } from 'rxjs';
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
    MatCard,
    MatIconModule,
    MatDialogModule,
    MatButton,
    DatePipe,
    TitleCasePipe,
    AsyncPipe,
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

  page = 0;
  size = 20;
  isLoading = true;
  hasError = false;
  shimmerRows = [1,2,3,4,5];

  // Filters
  selectedStatus: string = '';
  selectedPayment: string = '';

  hireRequestsPage$!: Observable<PageResponse<HireRequest>>;

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

    this.hireRequestsPage$ = this.hireRequestsService
      .getHireRequests(this.page, this.size, filter)
      .pipe(
        catchError(err => {
          this.hasError = true;
          this.isLoading = false;
          return of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true });
        }),
        shareReplay(1)
      );

    this.hireRequestsPage$.subscribe(() => {
      this.isLoading = false;
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadHireRequests();
  }

  onFilterChange(): void {
    this.page = 0; // Reset to first page on filter
    this.loadHireRequests();
  }

  updateStatus(id: number, status: string): void {
    this.hireRequestsService.updateStatus(id, status).subscribe({
      next: () => {
        this.snackBar.open(
          `✅ Request ${status.toLowerCase()} successfully!`,
          'Close',
          { duration: 3000 }
        );
        this.loadHireRequests();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(
          '❌ Failed to update request. Please try again.',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  viewRequest(id: number): void {
    this.router.navigate(['/hire-requests', id]);
  }
}
