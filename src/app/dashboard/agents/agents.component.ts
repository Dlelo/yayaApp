import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import { AgentService, Agent } from './agent.service';

@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  imports: [
    MatIconModule,
    MatButton,
    AsyncPipe,
    MatPaginatorModule,
  ],
  providers: [AgentService],
  standalone: true
})
export class AgentsComponent implements OnInit {
  private readonly agentService = inject(AgentService);

  page = 0;
  size = 20;

  agentsPage$!: Observable<PageResponse<Agent>>;

  ngOnInit(): void {
    this.loadAgents();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadAgents();
  }

  loadAgents(): void {
    this.agentsPage$ = this.agentService.getAgents(this.page, this.size);
  }

  verifyAgent(id: number): void {
    this.agentService.verifyAgent(id).subscribe({
      next: () => this.loadAgents(),
      error: (err) => console.error('Verify failed', err),
    });
  }

  getInitial(name: string | undefined): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
