import {Component, inject, Input} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-hire-request',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './hire-request.component.html',
  styleUrls: ['./hire-request.component.scss'],
})
export class HireRequestComponent {
  private readonly router: Router = inject(Router);
  @Input() houseHelpName = 'Mary Akinyi';
  isSubscribed = false; // TODO: fetch this from backend or service


  confirmHire() {
    alert(`Hire confirmed for ${this.houseHelpName}!`);
    // TODO: send hire request to backend
  }

  redirectToPay() {
    this.router.navigate(['/pay'], { queryParams: { hire: this.houseHelpName } });
  }
}
