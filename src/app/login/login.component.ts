import {Component, inject} from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {Router} from '@angular/router';
import {LoginService} from './login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private loginService = inject(LoginService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';

  form = new FormGroup({
    email: new FormControl('', Validators.required),
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
        this.redirectBasedOnRole(res.role);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed';
        console.error('Login error:', err);
      }
    });
  }

  private redirectBasedOnRole(role: string): void {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/dashboard']);
        break;
      case 'HOMEOWNER':
        this.router.navigate(['/home']);
        break;
      case 'HOUSEHELP':
        this.router.navigate(['/account-details']);
        break;
      case 'AGENT':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}
