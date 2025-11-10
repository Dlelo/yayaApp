import {Component, inject, OnInit} from '@angular/core';
import {MatDivider} from '@angular/material/divider';
import {MatCard} from '@angular/material/card';
import {AsyncPipe, DatePipe, JsonPipe, NgClass} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {AccountDetailsService} from './account-details.service';
import {Observable} from 'rxjs';
import {LoginService} from '../login/login.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  imports: [
    MatDivider,
    MatIconModule,
    MatCard,
    NgClass,
    DatePipe,
    MatButton,
    AsyncPipe,
  ],
  standalone: true,
})
export class AccountDetailsComponent implements OnInit {
  private readonly loginService: LoginService = inject(LoginService);
  private readonly accountDetails:AccountDetailsService  = inject(AccountDetailsService);
  private readonly router:Router = inject(Router);


  userId:number | null = this.loginService.userId();

  userDetails: Observable<{
    id: number;
    name: string;
    email: string;
    roles: string[];
    houseHelp: {
      contactPersons:string
      currentLocation:string,
      goodConduct:string,
      homeLocation:string,
      languages:string[]
      levelOfEducation:string,
      medicalReport:string,
      nationalId:string,
      numberOfChildren:string,
      religion:string,
      skills:string[]
      yearsOfExperience:number
    };
    homeOwner: string | null;
    subscription: {
      plan: string,
      active: boolean,
      expiry:string,
    },
  }> | null = null;

  ngOnInit(): void {
    if(this.userId === null) return;
   this.userDetails = this.accountDetails.getUserById(this.userId)
  }

  editAccount() {
    this.router.navigate(['/edit-account']);
  }

}
