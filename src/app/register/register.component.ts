import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RegisterService } from './register.service';
import { Router, RouterLink } from '@angular/router';
import libphonenumber from 'google-libphonenumber';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

export function phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  try {
    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
    const phoneNumber = phoneUtil.parse(value, 'KE');
    if (!phoneUtil.isValidNumber(phoneNumber)) {
      return { invalidPhoneNumber: true };
    }
    const formatted = phoneUtil.format(phoneNumber, libphonenumber.PhoneNumberFormat.E164);
    control.setValue(formatted, { emitEvent: false });
    return null;
  } catch {
    return { invalidPhoneNumber: true };
  }
}

@Component({
  selector: 'app-register-househelp',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterHousehelpComponent {
  private readonly registerService = inject(RegisterService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  hidePassword = true;
  hideConfirmPassword = true;

  form = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.email]),
    phoneNumber: new FormControl('', [Validators.required, phoneNumberValidator]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
    termsAccepted: new FormControl(false, [Validators.requiredTrue]),
  }, { validators: passwordMatchValidator });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, phoneNumber, password } = this.form.value;
    const payload = {
      name: `${firstName!.trim()} ${lastName!.trim()}`,
      email: email ?? '',
      phoneNumber: phoneNumber!,
      password: password!,
    };

    this.registerService.register(payload).subscribe({
      next: () => {
        this.snackBar.open('Account created successfully! Please sign in.', 'Close', { duration: 4000 });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        let message = 'Registration failed. Please try again.';
        if (error.status === 400) {
          message = 'Invalid registration data. Please check your inputs.';
        } else if (error.status === 409) {
          message = 'Email or phone number already exists.';
        } else if (error.status === 403) {
          message = 'You are not authorised to register with this role.';
        }
        this.snackBar.open(message, 'Close', { duration: 5000 });
      },
    });
  }
}
