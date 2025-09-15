import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register-househelp',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './register.component.html',
})
export class RegisterHousehelpComponent {
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    phone: new FormControl('', [Validators.pattern(/^254\d{9}$/)]),
  });

  submit() {
    console.log(this.form.value);
  }
}
