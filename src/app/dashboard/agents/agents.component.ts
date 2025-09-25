import { Component } from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';


@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  imports: [
    MatCard,
    MatIconModule,
    MatButton,
  ],
  standalone: true
})
export class AgentsComponent {
  users = [
    { name: 'Jane Doe', email: 'jane@example.com', role: 'Home Owner', active: true },
    { name: 'Mary Akinyi', email: 'mary@example.com', role: 'Househelp', active: true },
    { name: 'John Mwangi', email: 'john@example.com', role: 'Home Owner', active: false },
  ];
}
