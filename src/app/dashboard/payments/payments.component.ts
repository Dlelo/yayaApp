import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { PaymentService, Payment, PaymentPage, PaymentStatus } from './payments-list.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  providers: [PaymentService],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('paymentDetailsDialog') paymentDetailsDialog!: TemplateRef<any>;

  // Raw data from backend
  payments: Payment[] = [];

  // Filtered + paginated slices
  filteredPayments: Payment[] = [];
  paginatedPayments: Payment[] = [];

  displayedColumns: string[] = [
    'transactionId', 'user', 'amount', 'provider', 'status', 'createdAt', 'actions'
  ];

  // Pagination
  totalElements = 0;
  pageSize = 20;
  currentPage = 0;

  // Filters
  searchQuery = '';
  selectedStatus: string | null = null;

  // State
  loading = false;
  error: string | null = null;
  selectedPayment: Payment | null = null;

  constructor(
    private paymentService: PaymentService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(page: number = 0, size: number = 100): void {
    this.loading = true;
    this.error = null;

    // Load a large page so client-side filtering works across all records
    this.paymentService.getPayments(page, size).subscribe({
      next: (response: PaymentPage) => {
        this.payments = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Failed to load payments. Please try again.';
        this.loading = false;
      }
    });
  }

  // ─── Filtering ──────────────────────────────────────────────

  onSearchChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  clearSearch(): void {
  this.searchQuery = '';
  this.applyFilters();
}

  setStatusFilter(status: string | null): void {
    this.selectedStatus = status;
    this.currentPage = 0;
    this.applyFilters();
  }

  selectedProvider: string | null = null;

onStatusChange(): void {
  this.currentPage = 0;
  this.applyFilters();
}

clearAllFilters(): void {
  this.searchQuery = '';
  this.selectedStatus = null;
  this.selectedProvider = null;
  this.currentPage = 0;
  this.applyFilters();
}

applyFilters(): void {
  let result = [...this.payments];

  if (this.selectedStatus) {
    result = result.filter(p => p.status === this.selectedStatus);
  }

  if (this.selectedProvider) {
    result = result.filter(p => p.provider === this.selectedProvider);
  }

  if (this.searchQuery.trim()) {
    const query = this.searchQuery.toLowerCase().trim();
    result = result.filter(p =>
      p.transactionId?.toLowerCase().includes(query) ||
      p.user?.firstName?.toLowerCase().includes(query) ||
      p.user?.lastName?.toLowerCase().includes(query) ||
      `${p.user?.firstName} ${p.user?.lastName}`.toLowerCase().includes(query)
    );
  }

  this.filteredPayments = result;
  this.updatePage();
}

  updatePage(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPayments = this.filteredPayments.slice(start, end);
  }

  // ─── Pagination ─────────────────────────────────────────────

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePage();
  }

  // ─── Actions ────────────────────────────────────────────────

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'SUCCESS': 'check_circle',
      'PENDING': 'schedule',
      'FAILED': 'cancel',
    };
    return iconMap[status] || 'help';
  }

  viewDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.dialog.open(this.paymentDetailsDialog, { width: '500px' });
  }

  verifyPayment(payment: Payment): void {
    payment.status = PaymentStatus.SUCCESS;
    this.paymentService.verifyPayment(payment).subscribe({
      next: (response) => {
        console.log('Payment verified:', response);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error verifying payment:', error)
    });
  }

  downloadReceipt(payment: Payment): void {
    console.log('Downloading receipt for payment:', payment.id);
  }

  refresh(): void {
    this.loadPayments();
  }
}