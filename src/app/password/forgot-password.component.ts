import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PasswordService } from './password.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const a = group.get('newPassword')?.value;
  const b = group.get('confirmPassword')?.value;
  return a && b && a !== b ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./password-shared.scss'],
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly passwordSvc = inject(PasswordService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  step = signal<'credentials' | 'otp'>('credentials');
  submitting = signal(false);
  resending = signal(false);
  phone = signal('');

  hideNew = true;
  hideConfirm = true;

  private sessionToken: string | null = null;
  private pendingPassword = '';

  credentialsForm: FormGroup = this.fb.group(
    {
      phone: ['', [Validators.required, Validators.pattern(/^(\+254|254|0)[17]\d{8}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  otpForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  sendOtp(): void {
    if (this.credentialsForm.invalid) {
      this.credentialsForm.markAllAsTouched();
      return;
    }
    const { phone, newPassword } = this.credentialsForm.value;
    this.submitting.set(true);
    this.phone.set(phone);
    this.pendingPassword = newPassword;

    this.passwordSvc.forgotPassword(phone).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.sessionToken) {
          this.sessionToken = res.sessionToken;
          this.step.set('otp');
        } else {
          this.snack.open(res.message || 'Check your phone for a reset code.', 'OK', { duration: 4000 });
        }
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Could not send OTP. Please try again.';
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  resend(): void {
    if (this.resending() || !this.phone()) return;
    this.resending.set(true);
    this.passwordSvc.forgotPassword(this.phone()).subscribe({
      next: (res) => {
        this.resending.set(false);
        if (res.sessionToken) {
          this.sessionToken = res.sessionToken;
          this.snack.open('A new OTP has been sent.', 'OK', { duration: 3000 });
        }
      },
      error: () => {
        this.resending.set(false);
        this.snack.open('Could not resend. Try again.', 'Close', { duration: 3000 });
      },
    });
  }

  submitReset(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    if (!this.sessionToken) {
      this.snack.open('Session expired. Start over.', 'Close', { duration: 4000 });
      this.step.set('credentials');
      return;
    }
    this.submitting.set(true);
    const { code } = this.otpForm.value;
    this.passwordSvc.resetPassword(this.sessionToken, code as string, this.pendingPassword).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snack.open('Password reset! Please sign in.', 'OK', { duration: 5000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Invalid or expired OTP.';
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  goBack(): void {
    this.step.set('credentials');
    this.otpForm.reset();
  }
}
