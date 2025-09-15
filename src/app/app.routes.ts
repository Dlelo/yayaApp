import { Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ListingsComponent} from './listing/listing.component';
import {RegisterHousehelpComponent} from './register/register.component';
import {ProfileComponent} from './profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'listings', component: ListingsComponent },
  { path: 'register', component: RegisterHousehelpComponent },
  { path: 'profile/:id', component: ProfileComponent },
];
