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
    path: 'admin',
    component: DashboardComponent,
    children: [
      { path: 'users', loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent) },
      { path: 'subscriptions', loadComponent: () => import('./admin/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent) },
      { path: 'requests', loadComponent: () => import('./admin/requests/requests.component').then(m => m.RequestsComponent) },
      { path: 'reports', loadComponent: () => import('./admin/reports/reports.component').then(m => m.ReportsComponent) },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
