import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {CurrencyPipe} from '@angular/common';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  imports: [
    MatCard,
    CurrencyPipe
  ]
})
export class ReportsComponent {
  totalUsers = 120;
  activeSubs = 85;
  hireRequests = 40;
  revenue = 50000;
}
