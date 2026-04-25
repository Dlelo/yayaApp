import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HireRequestService } from './hire-request.service';
import { HttpErrorResponse } from '@angular/common/http';
import { HapticsService } from '../core/haptics.service';

@Component({
  selector: 'app-hire-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './hire-request.component.html',
  styleUrls: ['./hire-request.component.scss'],
})
export class HireRequestComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly hireService = inject(HireRequestService);
  private readonly snack = inject(MatSnackBar);
  private readonly haptics = inject(HapticsService);

  houseHelpId: number | null = null;
  houseHelpName = '';
  minDate = new Date();
  submitting = signal(false);

  form: FormGroup = this.fb.group({
    startDate: [null, Validators.required],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const idParam = params.get('houseHelpId') ?? params.get('id');
    this.houseHelpId = idParam ? Number(idParam) : null;
    this.houseHelpName = params.get('name') ?? 'this house help';
  }

  submit(): void {
    if (!this.houseHelpId) {
      this.snack.open('Missing house help. Pick someone from the listing first.', 'Close', {
        duration: 4000,
      });
      this.router.navigate(['/listing']);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { startDate, message } = this.form.value;
    const isoDate = (startDate as Date).toISOString().slice(0, 10);

    this.submitting.set(true);
    this.hireService
      .create({ houseHelpId: this.houseHelpId, startDate: isoDate, message })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.haptics.success();
          this.snack.open('Hire request sent!', 'OK', { duration: 3000 });
          this.router.navigate(['/my-hires']);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          void this.haptics.error();
          if (err.status === 402) {
            this.snack.open(
              'A subscription or payment is required before hiring.',
              'Pay now',
              { duration: 5000 }
            );
            this.router.navigate(['/pay'], {
              queryParams: { hire: this.houseHelpName, houseHelpId: this.houseHelpId },
            });
            return;
          }
          const msg =
            typeof err.error === 'string' ? err.error : err.error?.message || 'Failed to send hire request.';
          this.snack.open(msg, 'Close', { duration: 4000 });
        },
      });
  }
}
