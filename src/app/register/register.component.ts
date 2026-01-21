import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RegisterService } from './register.service';
import { Router } from '@angular/router';
import libphonenumber from 'google-libphonenumber';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSnackBar} from '@angular/material/snack-bar';

// Custom validator for password match
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

// Custom validator for phone number
export function phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null; // Let required validator handle empty values
  }

  try {
    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

    // You might want to set a default region based on your application's needs
    // For example, you could use 'IN' for India, 'US' for United States, etc.
    // Or you could parse the number in international format
    const defaultRegion = 'IN'; // Change this based on your target audience

    // Try to parse the phone number
    const phoneNumber = phoneUtil.parse(value, defaultRegion);

    // Check if the number is valid
    if (!phoneUtil.isValidNumber(phoneNumber)) {
      return { invalidPhoneNumber: true };
    }

    // Optional: Format the number to E.164 format
    const formattedNumber = phoneUtil.format(phoneNumber, libphonenumber.PhoneNumberFormat.E164);
    control.setValue(formattedNumber, { emitEvent: false });

    return null;
  } catch (error) {
    console.error('Phone number parsing error:', error);
    return { invalidPhoneNumber: true };
  }
}

// Alternative: More flexible validator that tries multiple approaches
export function flexiblePhoneNumberValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null; // Let required validator handle empty values
  }

  try {
    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

    // Try parsing with international format first
    try {
      const phoneNumber = phoneUtil.parse(value);
      if (phoneUtil.isValidNumber(phoneNumber)) {
        const formattedNumber = phoneUtil.format(phoneNumber, libphonenumber.PhoneNumberFormat.E164);
        control.setValue(formattedNumber, { emitEvent: false });
        return null;
      }
    } catch (e) {
      // If international parsing fails, try with default region
    }

    // Try with default region
    const defaultRegion = 'IN'; // Change based on your needs
    const phoneNumber = phoneUtil.parse(value, defaultRegion);

    if (phoneUtil.isValidNumber(phoneNumber)) {
      const formattedNumber = phoneUtil.format(phoneNumber, libphonenumber.PhoneNumberFormat.E164);
      control.setValue(formattedNumber, { emitEvent: false });
      return null;
    }

    return { invalidPhoneNumber: true };
  } catch (error) {
    console.error('Phone number parsing error:', error);
    return { invalidPhoneNumber: true };
  }
}

// You can also create a region-specific validator
export function createRegionSpecificPhoneValidator(regionCode: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    try {
      const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
      const phoneNumber = phoneUtil.parse(value, regionCode);

      if (!phoneUtil.isValidNumber(phoneNumber)) {
        return { invalidPhoneNumber: true };
      }

      const formattedNumber = phoneUtil.format(phoneNumber, libphonenumber.PhoneNumberFormat.E164);
      control.setValue(formattedNumber, { emitEvent: false });

      return null;
    } catch (error) {
      console.error('Phone number parsing error:', error);
      return { invalidPhoneNumber: true };
    }
  };
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
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './register.component.html',
})
export class RegisterHousehelpComponent {
  private registerService:RegisterService = inject(RegisterService);
  private router:Router = inject(Router);
  private snackBar:MatSnackBar = inject(MatSnackBar);

  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';

  // Choose the validator based on your needs:
  // Option 1: Simple validator with default region
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    phoneNumber: new FormControl('', [
      Validators.required,
      phoneNumberValidator
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6)
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.email]),

    termsAccepted: new FormControl(false, [Validators.requiredTrue]),
  }, { validators: passwordMatchValidator });

  submit() {
    console.log('Form value:', this.form.value);

    if (this.form.valid) {
      // Remove confirmPassword before sending to API
      const formData = { ...this.form.value };
      delete formData.confirmPassword;

      this.registerService.register(formData as any).subscribe({
        next: (response) => {
          this.snackBar.open('✅House help updated successfully!', 'Close', {
            duration: 3000,
          });
          console.log('Registration successful', response);
          this.router.navigate(['/login']); // Redirect to login page
        },
        error: (error) => {
          this.errorMessage = error?.message;
          if (error.status === 400) {
            this.errorMessage  ='❌ Invalid registration data. Please check your inputs.';
          } else if (error.status === 409) {
            this.errorMessage = "❌Email or phone number already exists.";
          } else {
            this.errorMessage = " ❌Registration failed. Please try again.";
          }

          this.snackBar.open(this.errorMessage, 'Close', {
            duration: 3000,
          });
          console.error('Registration failed', error);
          // Handle specific error messages
        }
      });
    } else {
      this.form.markAllAsTouched();

      // Show specific errors
      if (this.form.hasError('passwordMismatch')) {
        alert('Passwords do not match. Please check and try again.');
      }

      // Check for phone number validation errors
      const phoneControl = this.form.get('phoneNumber');
      if (phoneControl?.hasError('invalidPhoneNumber')) {
        alert('Please enter a valid phone number.');
      }
    }
  }
}
