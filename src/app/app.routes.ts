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
import {OverviewComponent} from './dashboard/overview/overview.component';
import {LoginComponent} from './login/login.component';
import {AuthGuard} from './auth.guard';
import {RoleGuard} from './role.guard';
import {TermsOfUseComponent} from './terms-of-use/terms-of-use.component';
import {PrivacyPolicyComponent} from './privacy-policy/privacy-policy.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'listings',
    component: ListingsComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_HOMEOWNER','ROLE_ADMIN', 'ROLE_AGENT', 'ROLE_SECURITY', 'ROLE_SALES'] },
  },
  { path: 'register', component: RegisterHousehelpComponent },
  { path: 'login', component:LoginComponent },
  {
    path: 'profile/:id',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },

  { path: 'hire',
    component: HireRequestComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'pay',
    component: PayComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'account/:id',
    component: AccountDetailsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'edit-account/:id',
    component: EditAccountDetailsComponent,
    canActivate: [AuthGuard]
  },

  {
    path:'terms-of-use',
    component:TermsOfUseComponent,
  },

  {
    path:'privacy-policy',
    component:PrivacyPolicyComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_AGENT', 'ROLE_SECURITY', 'ROLE_SALES'] },
    children: [
      {
        path:'users',
        loadComponent: () => import('./dashboard/users/users.component').then(m => m.UsersComponent) },
      {
        path: 'agents', loadComponent: () => import('./dashboard/agents/agents.component').then(m => m.AgentsComponent) },
      {
        path: 'houseHelps', loadComponent: () => import('./dashboard/house-helps/house-helps.component').then(m => m.HouseHelpsComponent) },
      {
        path: 'homeOwners', loadComponent: () => import('./dashboard/home-owners/home-owners.component').then(m => m.HomeOwnersComponent) },
     {
       path: 'requests',
       canActivate: [RoleGuard],
       data: { roles: ['ROLE_ADMIN'] },
       loadComponent: () => import('./dashboard/hire-requests/hire-requests.component').then(m => m.HireRequestsComponent),
     },
      {
        path: 'reports',
        canActivate: [RoleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadComponent: () => import('./dashboard/reports/reports.component').then(m => m.ReportsComponent) },
       { path: '', component: OverviewComponent, pathMatch: 'full' },
    ]
  },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
