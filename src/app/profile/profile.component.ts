import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [MatCardModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  name = '';

  constructor(private route: ActivatedRoute) {
    this.name = this.route.snapshot.params['id'];
  }

  upload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    console.log(files);
  }
}
