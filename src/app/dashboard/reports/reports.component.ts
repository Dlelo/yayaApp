import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { forkJoin, catchError, of } from 'rxjs';
import { UsersService } from '../users/users.service';
import { HousehelpService } from '../house-helps/house-helps.service';
import { HireRequestsService } from '../hire-requests/hire-requests.service';
import { PaymentService } from '../payments/payments-list.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  imports: [CurrencyPipe],
  providers: [UsersService, HousehelpService, HireRequestsService],
})
export class ReportsComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly househelpService = inject(HousehelpService);
  private readonly hireRequestsService = inject(HireRequestsService);
  private readonly paymentService = inject(PaymentService);

  readonly loading = signal(true);
  readonly totalUsers = signal(0);
  readonly totalHouseHelps = signal(0);
  readonly totalHireRequests = signal(0);
  readonly totalPayments = signal(0);

  ngOnInit(): void {
    forkJoin({
      users: this.usersService.getUsers(0, 1, {}).pipe(catchError(() => of({ totalElements: 0 } as any))),
      houseHelps: this.househelpService.getHouseHelps(0, 1, null).pipe(catchError(() => of({ totalElements: 0 } as any))),
      hireRequests: this.hireRequestsService.getHireRequests(0, 1).pipe(catchError(() => of({ totalElements: 0 } as any))),
      payments: this.paymentService.getPayments(0, 1).pipe(catchError(() => of({ totalElements: 0 } as any))),
    }).subscribe({
      next: (res) => {
        this.totalUsers.set(res.users.totalElements ?? 0);
        this.totalHouseHelps.set(res.houseHelps.totalElements ?? 0);
        this.totalHireRequests.set(res.hireRequests.totalElements ?? 0);
        this.totalPayments.set(res.payments.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
