import {Component, inject, OnInit} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-pay-hire',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.scss'],
})
export class PayComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  houseHelpName = '';

  payForm = this.formBuilder.group({
    plan: ['', Validators.required],
    phone: ['', Validators.required],
  });


  ngOnInit():void {
    this.houseHelpName = this.activatedRoute.snapshot.queryParamMap.get('hire') ?? 'the househelp';

  }

  pay() {
    if (this.payForm.valid) {
      console.log('Payment initiated', this.payForm.value);
      alert(`Payment request sent. Once confirmed, you can now hire ${this.houseHelpName}`);
      this.router.navigate(['/hire'], { queryParams: { success: true } });
    }
  }
}
