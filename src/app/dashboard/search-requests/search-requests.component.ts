import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import {
  SearchRequestsService,
  HouseHelpLookupAudit,
  HouseHelpLookupAuditPage,
  LookupPaymentStatus,
} from './search-requests.service';

/**
 * Admin dashboard tab: audit trail of the anonymous "pay to reveal a house
 * help's contact details via SMS" flow. Deliberately does not show the house
 * help's phone number — that is only ever disclosed via SMS to the paying
 * visitor, never surfaced in an API response or the admin UI.
 */
@Component({
  selector: 'app-search-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatIconModule,
  ],
  providers: [SearchRequestsService],
  templateUrl: './search-requests.component.html',
  styleUrls: ['./search-requests.component.scss']
})
export class SearchRequestsComponent implements OnInit {
  requests: HouseHelpLookupAudit[] = [];
  totalElements = 0;
  pageSize = 20;
  currentPage = 0;

  loading = false;
  error: string | null = null;

  readonly LookupPaymentStatus = LookupPaymentStatus;

  constructor(
    private searchRequestsService: SearchRequestsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(page: number = 0, size: number = this.pageSize): void {
    this.loading = true;
    this.error = null;

    this.searchRequestsService.getLookupRequests(page, size).subscribe({
      next: (response: HouseHelpLookupAuditPage) => {
        this.requests = response.content;
        this.totalElements = response.totalElements;
        this.currentPage = response.number;
        this.pageSize = response.size;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Failed to load search requests. Please try again.';
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadRequests(event.pageIndex, event.pageSize);
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      SUCCESS: 'check_circle',
      PENDING: 'schedule',
      FAILED: 'cancel',
    };
    return icons[status] ?? 'help';
  }
}
