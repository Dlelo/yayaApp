import { Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ListingsComponent} from './listing/listing.component';
import {RegisterHousehelpComponent} from './register/register.component';
import {ProfileComponent} from './profile/profile.component';
import {PayComponent} from './pay/pay.component';
import {HireRequestComponent} from './hire-request/hire-request.component';
import {AccountDetailsComponent} from './account-details/account-details.component';
import {EditAccountDetailsComponent} from './edit-account/edit-account.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'listings', component: ListingsComponent },
  { path: 'register', component: RegisterHousehelpComponent },
  { path: 'profile/:id', component: ProfileComponent },
  { path: 'hire', component: HireRequestComponent },
  { path: 'pay', component: PayComponent },
  { path: 'account/:id', component:AccountDetailsComponent},
  { path: 'edit-account/:id', component: EditAccountDetailsComponent}
];
