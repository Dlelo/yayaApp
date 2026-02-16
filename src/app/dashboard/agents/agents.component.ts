import { Component, inject, OnInit } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { AgentsService } from './agents.service';
import { Router } from '@angular/router';

export interface Agent {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  verified: boolean;
  locationOfOperation: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.scss'],
  imports: [
    MatCard,
    MatIconModule,
    MatButton,
    MatPaginatorModule,
    AsyncPipe,
  ],
  standalone: true
})
export class AgentsComponent implements OnInit {
  private readonly agentsService = inject(AgentsService);
  private readonly router = inject(Router);

  page = 0;
  size = 20;

  agentsPage$!: Observable<PageResponse<Agent>>;

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.agentsPage$ = this.agentsService.getAgents(this.page, this.size);
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadAgents();
  }

  viewAgent(id: number): void {
    this.router.navigate(['/dashboard/agents', id]);
  }

  editAgent(id: number): void {
    this.router.navigate(['/dashboard/agents', id, 'edit']);
  }

  deleteAgent(id: number): void {
    // wire up delete dialog here
  }
}
