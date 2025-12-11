import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private loginService = inject(LoginService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';
  hidePassword = true;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.form.value;

    this.loginService.login(email!, password!).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
        console.error('Login error:', err);
      }
    });
    this.loginService.refreshAuthState();
  }

  private redirectBasedOnRole(roleData: string | string[]): void {
    let roles: string[] = [];

    if (Array.isArray(roleData)) {
      roles = roleData;
    } else if (typeof roleData === 'string') {
      const matches = roleData.match(/name=(\w+)/g);
      roles = matches ? matches.map(m => m.replace('name=', '')) : [roleData.trim()];
    }

    if (roles.includes('ADMIN')) {
      this.router.navigate(['/dashboard']);
    } else if (roles.includes('AGENT')) {
      this.router.navigate(['/dashboard']);
    } else if (roles.includes('HOMEOWNER')) {
      this.router.navigate(['/home']);
    } else if (roles.includes('HOUSEHELP')) {
      this.router.navigate(['/account-details']);
    } else {
      this.router.navigate(['/']);
    }
  }

}
