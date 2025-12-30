import {Component, inject} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatDivider} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {ActivatedRoute, Router} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {LoginService} from '../login/login.service';
import {AccountDetailsService} from '../account-details/account-details.service';
import {catchError, filter, Observable, of, shareReplay, switchMap} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [
    MatIconModule,
    MatCard,
    MatDivider,
    MatButton,
    AsyncPipe
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  private readonly router:Router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly activatedRoute = inject(ActivatedRoute)


  /** Derived streams */
  houseHelpDetails$!: Observable<HouseHelp>;

    ngOnInit(): void {
      this.houseHelpDetails$ = this.activatedRoute.paramMap.pipe(
        switchMap(params => {
          const idParam = params.get('id');

          // Validate ID
          if (!idParam || isNaN(Number(idParam))) {
            console.error('Invalid house help ID:', idParam);
            return of(null); // Return null if ID is invalid
          }

          const id = Number(idParam);
          return this.accountDetails.getHouseHelpDetails(id).pipe(
            catchError(error => {
              console.error('Error fetching house help:', error);
              return of(null);
            })
          );
        })
      );
    }


  navigate(path: string) {
    this.router.navigate([path]);
  }
}
