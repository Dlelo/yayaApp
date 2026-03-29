import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { PaymentService, Payment, PaymentPage, PaymentStatus } from './payments-list.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  providers: [PaymentService],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss']
})
export class PaymentsComponent implements OnInit {
  @ViewChild('paymentDetailsDialog') paymentDetailsDialog!: TemplateRef<any>;

  payments: Payment[] = [];
  totalElements = 0;
  pageSize = 20;
  currentPage = 0;

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

  loadPayments(page: number = 0, size: number = this.pageSize): void {
    this.loading = true;
    this.error = null;

    this.paymentService.getPayments(page, size).subscribe({
      next: (response: PaymentPage) => {
        this.payments = response.content;
        this.totalElements = response.totalElements;
        this.currentPage = response.number;
        this.pageSize = response.size;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Failed to load payments. Please try again.';
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPayments(event.pageIndex, event.pageSize);
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      SUCCESS: 'check_circle',
      PENDING: 'schedule',
      FAILED: 'cancel',
    };
    return icons[status] ?? 'help';
  }

  viewDetails(payment: Payment): void {
    this.selectedPayment = payment;
    this.dialog.open(this.paymentDetailsDialog, { width: '480px' });
  }

  verifyPayment(payment: Payment): void {
    const prev = payment.status;
    payment.status = PaymentStatus.SUCCESS;
    this.cdr.detectChanges();
    this.paymentService.verifyPayment(payment.id).subscribe({
      next: () => this.loadPayments(this.currentPage, this.pageSize),
      error: () => {
        payment.status = prev;
        this.cdr.detectChanges();
      }
    });
  }

  archivePayment(payment: Payment): void {
    this.paymentService.archivePayment(payment.id).subscribe({
      next: () => this.loadPayments(this.currentPage, this.pageSize)
    });
  }
}
