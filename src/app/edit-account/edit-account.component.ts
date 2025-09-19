import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import {MatCard} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatDivider} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss'],
  standalone: true,
  imports: [
    MatCard,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatButton,
    MatDivider,
    MatInputModule
  ]
})
export class EditAccountDetailsComponent implements OnInit {
  accountDetailsForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // Mock current user data - replace with actual user service
    const currentUser = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '+254712345678',
    };

    this.accountDetailsForm = this.fb.group({
      name: [currentUser.name, [Validators.required]],
      email: [currentUser.email, [Validators.required, Validators.email]],
      phone: [currentUser.phone, [Validators.required]],
      password: [''], // optional
    });
  }

  saveAccountDetails() {
    if (this.accountDetailsForm.valid) {
      console.log('Updated Profile:', this.accountDetailsForm.value);
      // TODO: send update request to backend
      this.router.navigate(['/account']);
    }
  }

  cancel() {
    this.router.navigate(['/account']);
  }
}
