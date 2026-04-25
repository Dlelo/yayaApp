import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    CommonModule,
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
  private readonly password = inject(PasswordService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  step = signal<'identify' | 'verify'>('identify');
  submitting = signal(false);
  resending = signal(false);
  channel = signal<'sms' | 'email' | 'logged' | null>(null);

  /** Held in memory only — never put OTP/session tokens in the URL. */
  private sessionToken: string | null = null;
  identifier = signal('');

  hideNew = true;
  hideConfirm = true;

  identifyForm = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(4)]],
  });

  verifyForm: FormGroup = this.fb.group(
    {
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  submitIdentifier(): void {
    if (this.identifyForm.invalid) {
      this.identifyForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const id = this.identifyForm.value.identifier as string;
    this.identifier.set(id);

    this.password.forgotPassword(id).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.sessionToken) {
          this.sessionToken = res.sessionToken;
          this.channel.set(res.channel ?? null);
          this.step.set('verify');
        } else {
          // No matching account — show generic ack but don't progress.
          this.snack.open(res.message, 'OK', { duration: 4000 });
        }
      },
      error: () => {
        this.submitting.set(false);
        this.snack.open('Could not send reset code. Try again.', 'Close', { duration: 4000 });
      },
    });
  }

  resend(): void {
    if (this.resending() || !this.identifier()) return;
    this.resending.set(true);
    this.password.forgotPassword(this.identifier()).subscribe({
      next: (res) => {
        this.resending.set(false);
        if (res.sessionToken) {
          this.sessionToken = res.sessionToken;
          this.channel.set(res.channel ?? null);
          this.snack.open('A new code has been sent.', 'OK', { duration: 3000 });
        }
      },
      error: () => {
        this.resending.set(false);
        this.snack.open('Could not resend. Try again.', 'Close', { duration: 3000 });
      },
    });
  }

  submitReset(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }
    if (!this.sessionToken) {
      this.snack.open('Session expired. Start over.', 'Close', { duration: 4000 });
      this.step.set('identify');
      return;
    }
    this.submitting.set(true);
    const { code, newPassword } = this.verifyForm.value;
    this.password.resetPassword(this.sessionToken, code as string, newPassword as string).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snack.open('Password updated. Please sign in.', 'OK', { duration: 4000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Could not reset your password.';
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  goBack(): void {
    this.step.set('identify');
  }

  channelLabel(): string {
    const c = this.channel();
    if (c === 'sms') return 'sent via SMS';
    if (c === 'email') return 'sent to your email';
    return 'sent to your account';
  }
}
