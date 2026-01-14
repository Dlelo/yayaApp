import {Component, inject, computed, OnInit} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import {MatListItem, MatListModule, MatNavList} from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../login/login.service';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatListModule,
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    MatToolbar,
    MatIconButton,
  ]
})
export class DashboardComponent implements OnInit {

  private readonly loginService = inject(LoginService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  /** roles is a signal<string> */
  roles = this.loginService.userRoles;

  navLinks = [
    { path: 'agents', label: 'Agents', icon: 'group', roles: ['ROLE_ADMIN','ROLE_SECURITY', 'ROLE_SALES'] },
    { path: 'houseHelps', label: 'House Helps', icon: 'home', roles: ['ROLE_ADMIN','ROLE_SECURITY', 'ROLE_SALES'] },
    { path: 'homeOwners', label: 'Home Owners', icon: 'person', roles: ['ROLE_ADMIN','ROLE_SECURITY', 'ROLE_SALES'] },
    { path: 'requests', label: 'Requests', icon: 'assignment', roles: ['ROLE_ADMIN'] },
    { path: 'reports', label: 'Reports', icon: 'bar_chart', roles: ['ROLE_ADMIN'] },
    { path: 'users', label: 'Users', icon: 'people', roles: ['ROLE_ADMIN','ROLE_SECURITY', 'ROLE_SALES'] },
  ];

  sidenavMode: 'over' | 'side' = 'side';
  sidenavOpened = true;

  private readonly rolesArray = computed(() =>
    this.roles().map(role => role.trim())
  );

  readonly allowedNavLinks = computed(() =>
    this.navLinks.filter(link =>
      link.roles.some(role => this.rolesArray().includes(role))
    )
  );

 ngOnInit(): void {
   this.breakpointObserver.observe([Breakpoints.Small, Breakpoints.XSmall])
     .subscribe(result => {
       if (result.matches) {
         this.sidenavMode = 'over';
         this.sidenavOpened = false;
       } else {
         this.sidenavMode = 'side';
         this.sidenavOpened = true;
       }
     });
 }
}
