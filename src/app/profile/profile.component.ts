import {Component, inject, OnInit} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute, Router} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatSnackBar} from '@angular/material/snack-bar';
import {LoginService} from '../login/login.service';
import {AccountDetailsService} from '../account-details/account-details.service';
import {catchError, Observable, of, shareReplay, switchMap, take} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [
    MatIconModule,
    MatCard,
    MatButton,
    AsyncPipe,
    MatFormFieldModule,
    MatInput
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  private readonly router: Router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  /** Derived streams */
  houseHelpDetails$!: Observable<any>;

  ngOnInit(): void {
    this.houseHelpDetails$ = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');

        // Validate ID
        if (!idParam || isNaN(Number(idParam))) {
          console.error('Invalid house help ID:', idParam);
          return of(null);
        }

        const id = Number(idParam);
        return this.accountDetails.getHouseHelpDetails(id).pipe(
          catchError(error => {
            console.error('Error fetching house help:', error);
            return of(null);
          })
        );
      }),
      shareReplay(1)
    );
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  /**
   * Navigate to payment with house help details
   * FIXED: Now subscribes to Observable to get actual data
   */
  navigateToPay(route: string): void {
    if (route === '/pay') {
      // Subscribe to get the actual house help data
      this.houseHelpDetails$.pipe(take(1)).subscribe(houseHelp => {
        if (!houseHelp) {
          this.snackBar.open('Unable to load house help details', 'Close', { duration: 3000 });
          return;
        }

        this.router.navigate(['/pay'], {
          queryParams: {
            id: houseHelp.id,
            name: houseHelp.user?.name || 'House Help',
            location: houseHelp.currentLocation || houseHelp.homeLocation || '',
            houseHelpType: houseHelp.houseHelpType || 'day-burg'
          }
        });
      });
    } else {
      this.router.navigate([route]);
    }
  }

  /**
   * Alternative: Dedicated hire method (Cleaner)
   */
  hireHouseHelp(): void {
    this.houseHelpDetails$.pipe(take(1)).subscribe(houseHelp => {
      if (!houseHelp || !houseHelp.id) {
        this.snackBar.open('House help details not available', 'Close', { duration: 3000 });
        return;
      }

      this.router.navigate(['/pay'], {
        queryParams: {
          id: houseHelp.id,
          name: houseHelp.user?.name || 'House Help',
          location: houseHelp.currentLocation || houseHelp.homeLocation || '',
          houseHelpType: houseHelp.houseHelpType || 'day-burg'
        }
      });
    });
  }
}
