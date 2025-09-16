import {Component, inject, signal} from '@angular/core';
import {RouterModule, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {Router} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router: Router = inject(Router);

  protected readonly title = signal('yayaApp');

  navigate(path: string) {
    this.router.navigate([path]);
  }
}
