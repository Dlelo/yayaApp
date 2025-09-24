import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ListingsComponent } from './listing/listing.component';
import { RegisterHousehelpComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { PayComponent } from './pay/pay.component';
import { HireRequestComponent } from './hire-request/hire-request.component';
import { AccountDetailsComponent } from './account-details/account-details.component';
import { EditAccountDetailsComponent } from './edit-account/edit-account.component';
import {DashboardComponent} from './dashboard/dashboard.component';

export const routes: Routes = [
  // Public pages
  { path: '', component: HomeComponent },
  { path: 'listings', component: ListingsComponent },
  { path: 'register', component: RegisterHousehelpComponent },
  { path: 'profile/:id', component: ProfileComponent },

  // User account flow
  { path: 'hire', component: HireRequestComponent },
  { path: 'pay', component: PayComponent },
  { path: 'account/:id', component: AccountDetailsComponent },
  { path: 'edit-account/:id', component: EditAccountDetailsComponent },

  // Admin dashboard
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: 'agents', loadComponent: () => import('./dashboard/agents/agents.component').then(m => m.AgentsComponent) },
      { path: 'houseHelps', loadComponent: () => import('./dashboard/house-helps/house-helps.component').then(m => m.HouseHelpsComponent) },
      { path: 'homeOwners', loadComponent: () => import('./dashboard/home-owners/home-owners.component').then(m => m.HomeOwnersComponent) },
      { path: 'subscriptions', loadComponent: () => import('./dashboard/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent) },
      { path: 'requests', loadComponent: () => import('./dashboard/hire-requests/hire-requests.component').then(m => m.HireRequestsComponent) },
      { path: 'reports', loadComponent: () => import('./dashboard/reports/reports.component').then(m => m.ReportsComponent) },
      { path: '', redirectTo: 'reports', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
