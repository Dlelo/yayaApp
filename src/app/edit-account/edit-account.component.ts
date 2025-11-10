import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import {MatCard, MatCardModule} from '@angular/material/card';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatDivider} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {LoginService} from '../login/login.service';
import {AccountDetailsService} from '../account-details/account-details.service';
import {Observable, take, tap} from 'rxjs';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
  ]
})
export class EditAccountDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly snackBar = inject(MatSnackBar);

  userId: number | null = this.loginService.userId();
  userDetails$!: Observable<any>;

  form!: FormGroup;
  isHouseHelp = false;
  isHomeOwner = false;

  goodConductFileName: string | null = null;
  goodConductPreviewUrl: string | null = null;

  medicalReportFileName: string | null = null;
  medicalReportPreviewUrl: string | null = null;

  ngOnInit(): void {
    if (!this.userId) return;

    this.userDetails$ = this.accountDetails.getUserById(this.userId)
      .pipe(
        take(1),
      tap((user) => {
        this.isHouseHelp = user.roles.includes('HOUSEHELP');
        this.isHomeOwner = user.roles.includes('HOMEOWNER');
        this.initializeForm(user);
      })
    );
  }

  private initializeForm(user: any): void {
    this.form = this.fb.group({
      name: [user.name, Validators.required],
      email: [user.email, [Validators.required, Validators.email]],

      houseHelp: this.isHouseHelp
        ? this.fb.group({
          nationalId: [user.houseHelp?.nationalId || ''],
          yearsOfExperience: [user.houseHelp?.yearsOfExperience || 0],
          skills: [user.houseHelp?.skills?.join(', ') || ''],
          goodConduct: [user.houseHelp?.goodConduct || ''],
          medicalReport: [user.houseHelp?.medicalReport || ''],
        })
        : null,

      subscription: this.isHomeOwner
        ? this.fb.group({
          plan: [user.subscription?.plan || ''],
          active: [user.subscription?.active || false],
        })
        : null,
    });
  }

  onFileSelected(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.form.get(controlName)?.setValue(file);

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    if (controlName === 'goodConduct') {
      this.goodConductFileName = file.name;
      this.goodConductPreviewUrl = previewUrl;
    } else if (controlName === 'medicalReport') {
      this.medicalReportFileName = file.name;
      this.medicalReportPreviewUrl = previewUrl;
    }
  }

  removeFile(controlName: string): void {
    this.form.get(controlName)?.reset();

    if (controlName === 'goodConduct') {
      if (this.goodConductPreviewUrl) {
        URL.revokeObjectURL(this.goodConductPreviewUrl);
      }
      this.goodConductFileName = null;
      this.goodConductPreviewUrl = null;
    } else if (controlName === 'medicalReport') {
      if (this.medicalReportPreviewUrl) {
        URL.revokeObjectURL(this.medicalReportPreviewUrl);
      }
      this.medicalReportFileName = null;
      this.medicalReportPreviewUrl = null;
    }
  }



  save(): void {
    if (this.form.invalid || !this.userId) return;

    const formValue = this.form.value;

    if (formValue.houseHelp?.skills) {
      formValue.houseHelp.skills = formValue.houseHelp.skills
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }

    this.accountDetails.updateUser(this.userId, formValue).subscribe({
      next: () => {
        this.snackBar.open('✅ Account details updated successfully!', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/account']);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('❌ Failed to update account. Please try again.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/account']);
  }
}
