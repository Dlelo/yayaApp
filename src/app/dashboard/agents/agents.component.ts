import { Component, inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AgentService, Agent } from './agent.service';

interface AgentUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  agentProfile?: {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    nationalId: string;
    locationOfOperation: string;
    homeLocation: string;
    houseNumber: string;
    verified: boolean;
  };
}

@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    FormsModule,
    AsyncPipe,
    MatPaginatorModule,
  ],
  providers: [AgentService],
  standalone: true
})
export class AgentsComponent implements OnInit {
  @ViewChild('editAgentDialog') editAgentDialog!: TemplateRef<any>;

  private readonly agentService = inject(AgentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  page = 0;
  size = 20;
  loading = true;
  shimmerRows = [1,2,3,4,5];

  agentsPage$!: Observable<PageResponse<AgentUser>>;

  editingAgent: Partial<Agent> & { id?: number } = {};

  ngOnInit(): void {
    this.loadAgents();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadAgents();
  }

  loadAgents(): void {
    this.loading = true;
    this.agentsPage$ = (this.agentService.getAgents(this.page, this.size) as any).pipe(
      tap(() => this.loading = false),
      catchError(() => { this.loading = false; return of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true }); })
    );
  }

  verifyAgent(agentProfileId: number): void {
    this.agentService.verifyAgent(agentProfileId).subscribe({
      next: () => {
        this.snackBar.open('Agent verified', 'Close', { duration: 3000 });
        this.loadAgents();
      },
      error: (err) => this.snackBar.open(
        err?.error?.message || 'Verification failed — profile may be incomplete',
        'Close', { duration: 4000 }
      ),
    });
  }

  openEditDialog(user: AgentUser): void {
    const p = user.agentProfile;
    this.editingAgent = {
      id: p?.id,
      fullName: p?.fullName || user.name,
      phoneNumber: p?.phoneNumber || user.phoneNumber,
      email: p?.email || user.email,
      nationalId: p?.nationalId,
      locationOfOperation: p?.locationOfOperation,
      homeLocation: p?.homeLocation,
      houseNumber: p?.houseNumber,
    };
    this.dialog.open(this.editAgentDialog, { width: '520px' });
  }

  saveAgent(): void {
    if (!this.editingAgent.id) return;
    const { id, ...data } = this.editingAgent;
    this.agentService.updateAgent(id, data).subscribe({
      next: () => {
        this.snackBar.open('Agent updated', 'Close', { duration: 3000 });
        this.dialog.closeAll();
        this.loadAgents();
      },
      error: () => this.snackBar.open('Failed to update agent', 'Close', { duration: 3000 }),
    });
  }

  getInitial(name: string | undefined): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}
