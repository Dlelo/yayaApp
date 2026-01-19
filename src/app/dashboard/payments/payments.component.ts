import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { PaymentService, Payment, PaymentPage } from './payments-list.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule
  ],
  providers: [PaymentService],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('paymentDetailsDialog') paymentDetailsDialog!: TemplateRef<any>;

  payments: Payment[] = [];
  displayedColumns: string[] = [
    'transactionId',
    'user',
    'amount',
    'provider',
    'status',
    'createdAt',
    'actions'
  ];

  // Pagination
  totalElements = 0;
  pageSize = 20;
  currentPage = 0;

  // State
  loading = false;
  error: string | null = null;
  selectedPayment: Payment | null = null;

  constructor(
    private paymentService: PaymentService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  /**
   * Load payments from backend
   */
  loadPayments(page: number = 0, size: number = 10): void {
    this.loading = true;
    this.error = null;

    this.paymentService.getPayments(page, size).subscribe({
      next: (response: PaymentPage) => {
          this.payments = response.content;
          this.totalElements = response.totalElements;
          this.currentPage = response.number;
          this.pageSize = response.size;
          this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading payments:', error);
        this.error = error.error?.message || 'Failed to load payments. Please try again.';
        this.loading = false;
      }
    });
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments(event.pageIndex, event.pageSize);
  }

  /**
   * Get appropriate icon for payment status
   */
  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'COMPLETED': 'check_circle',
      'PENDING': 'schedule',
      'FAILED': 'cancel',
      'CANCELLED': 'block',
      'REFUNDED': 'replay'
    };
    return iconMap[status] || 'help';
  }

  /**
   * View payment details
   */
  viewDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.dialog.open(this.paymentDetailsDialog, {
      width: '500px'
    });
  }

  /**
   * Download payment receipt
   */
  downloadReceipt(payment: Payment): void {
    // TODO: Implement receipt download
    console.log('Downloading receipt for payment:', payment.id);
    
    // Example implementation:
    // this.paymentService.downloadReceipt(payment.id).subscribe({
    //   next: (blob) => {
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `receipt-${payment.transactionId}.pdf`;
    //     a.click();
    //   },
    //   error: (error) => {
    //     console.error('Error downloading receipt:', error);
    //   }
    // });
  }

  /**
   * Refresh payments list
   */
  refresh(): void {
    this.loadPayments(this.currentPage, this.pageSize);
  }

  /**
   * Filter by status (optional feature)
   */
  filterByStatus(status: string): void {
    // TODO: Implement status filtering
    // this.paymentService.getPaymentsByStatus(status, this.currentPage, this.pageSize)
    //   .subscribe(response => {
    //     this.payments = response.content;
    //     this.totalElements = response.totalElements;
    //   });
  }
}