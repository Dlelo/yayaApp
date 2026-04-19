import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { AgentService, Agent } from './agent.service';

interface AgentUserDTO {
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
    agentRole: string;
    agencyId?: number;
    agencyName?: string;
    agencyVerified?: boolean;
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
    MatPaginatorModule,
  ],
  providers: [AgentService],
  standalone: true
})
export class AgentsComponent implements OnInit {
  @ViewChild('editAgentDialog') editAgentDialog!: TemplateRef<any>;
  @ViewChild('createAgencyDialog') createAgencyDialog!: TemplateRef<any>;

  private readonly agentService = inject(AgentService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  page = 0;
  size = 20;
  loading = true;
  shimmerRows = [1, 2, 3, 4, 5];

  agentsPage: PageResponse<AgentUserDTO> | null = null;

  editingAgent: Partial<Agent> & { id?: number } = {};

  newAgency = { name: '', phoneNumber: '', email: '', locationOfOperation: '', homeLocation: '', houseNumber: '' };
  creatingAgency = false;

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
    this.agentService.getAgents(this.page, this.size).subscribe({
      next: (data: any) => {
        this.agentsPage = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.agentsPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true };
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
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

  openCreateDialog(): void {
    this.newAgency = { name: '', phoneNumber: '', email: '', locationOfOperation: '', homeLocation: '', houseNumber: '' };
    this.dialog.open(this.createAgencyDialog, { width: '520px' });
  }

  createAgency(): void {
    if (!this.newAgency.name.trim()) {
      this.snackBar.open('Agency name is required', 'Close', { duration: 3000 });
      return;
    }
    this.creatingAgency = true;
    const payload: any = { name: this.newAgency.name.trim() };
    if (this.newAgency.phoneNumber.trim()) payload.phoneNumber = this.newAgency.phoneNumber.trim();
    if (this.newAgency.email.trim()) payload.email = this.newAgency.email.trim();
    if (this.newAgency.locationOfOperation.trim()) payload.locationOfOperation = this.newAgency.locationOfOperation.trim();
    if (this.newAgency.homeLocation.trim()) payload.homeLocation = this.newAgency.homeLocation.trim();
    if (this.newAgency.houseNumber.trim()) payload.houseNumber = this.newAgency.houseNumber.trim();

    this.agentService.createAgency(payload).subscribe({
      next: () => {
        this.creatingAgency = false;
        this.snackBar.open('Agency created successfully', 'Close', { duration: 3000 });
        this.dialog.closeAll();
      },
      error: (err) => {
        this.creatingAgency = false;
        this.snackBar.open(err?.error || 'Failed to create agency', 'Close', { duration: 4000 });
      },
    });
  }

  openEditDialog(user: AgentUserDTO): void {
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

  /** Navigate to the agency portal. Uses agencyId from the agent's profile. */
  openPortal(agencyId: number | undefined): void {
    if (agencyId) {
      this.router.navigate(['/dashboard/agency', agencyId]);
    }
  }
}
