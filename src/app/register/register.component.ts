import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RegisterService } from './register.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register-househelp',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './register.component.html',
})
export class RegisterHousehelpComponent {
  private registerService = inject(RegisterService);
  private router = inject(Router);


  form = new FormGroup({
    name: new FormControl('', Validators.required),
    phone: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
  });

  submit() {
    console.log(this.form.value);
    if (this.form.valid) {
      this.registerService.register(this.form.value as any).subscribe({
        next: (response) => {
          console.log('Registration successful', response);
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Registration failed', error);
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
