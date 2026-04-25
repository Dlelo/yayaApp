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
  selector: 'app-change-password',
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
  templateUrl: './change-password.component.html',
  styleUrls: ['./password-shared.scss'],
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly password = inject(PasswordService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;
  submitting = signal(false);

  form: FormGroup = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { currentPassword, newPassword } = this.form.value;
    this.password.changePassword(currentPassword as string, newPassword as string).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snack.open('Password changed successfully.', 'OK', { duration: 4000 });
        this.router.navigate(['/menu']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message || 'Could not change your password.';
        this.snack.open(msg, 'Close', { duration: 4000 });
      },
    });
  }
}
