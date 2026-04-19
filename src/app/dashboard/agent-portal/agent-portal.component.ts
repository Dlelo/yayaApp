import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from '../../login/login.service';
import {
  AgentPortalService,
  Agency,
  AgentHouseHelp,
  AgencyEarnings,
  AgencyPage,
} from './agent-portal.service';

@Component({
  selector: 'app-agent-portal',
  templateUrl: './agent-portal.component.html',
  styleUrls: ['./agent-portal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    RouterLink,
  ],
  providers: [AgentPortalService],
})
export class AgentPortalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(AgentPortalService);
  private loginService = inject(LoginService);
  private snackBar = inject(MatSnackBar);

  readonly currentRoles = this.loginService.userRoles;
  readonly isAdmin = computed(() => this.currentRoles().includes('ROLE_ADMIN'));

  // ── state ──────────────────────────────────────────
  loading = signal(true);
  agency = signal<Agency | null>(null);
  earnings = signal<AgencyEarnings | null>(null);
  houseHelps = signal<AgentHouseHelp[]>([]);

  /** True when admin is viewing an agency via :agencyId param */
  isAdminView = false;
  /** The agency entity ID being viewed */
  agencyId: number | null = null;

  /** Current user's role within the agency (null if not a member or not loaded) */
  readonly myMemberRole = computed(() => {
    const userId = this.loginService.userId();
    const ag = this.agency();
    if (!userId || !ag) return null;
    const member = ag.members.find(m => m.userId === +userId);
    return member?.agentRole ?? null;
  });

  // ── withdrawal form ─────────────────────────────────
  showWithdrawalForm = false;
  withdrawalAmount = '';
  withdrawalPhone = '';
  withdrawalNotes = '';
  withdrawalError = '';
  withdrawalSubmitting = false;

  // ── edit agency form ────────────────────────────────
  showEditForm = false;
  editData: { name?: string; phoneNumber?: string; email?: string; locationOfOperation?: string; homeLocation?: string; houseNumber?: string } = {};

  // ── add member form ─────────────────────────────────
  showAddMemberForm = false;
  memberSearchQuery = '';
  memberSearchResults: any[] = [];
  memberSearchLoading = false;
  memberSearchError = '';
  selectedMemberUser: any = null;
  newMemberRole = 'ADMIN';
  addMemberError = '';
  addMemberSubmitting = false;

  // ── admin agencies list ─────────────────────────────
  /** Shown when admin navigates to /dashboard/agency with no agencyId param */
  showAdminList = false;
  allAgencies = signal<Agency[]>([]);
  showCreateForm = false;
  createData: { name: string; phoneNumber: string; email: string; locationOfOperation: string; homeLocation: string; houseNumber: string } =
    { name: '', phoneNumber: '', email: '', locationOfOperation: '', homeLocation: '', houseNumber: '' };
  createError = '';
  createSubmitting = false;

  // ── add househelp form ──────────────────────────────
  showAddHouseHelpForm = false;
  newHouseHelp = { name: '', phoneNumber: '', email: '', password: '' };
  addHouseHelpError = '';
  addHouseHelpSubmitting = false;

  // ── househelp grouping ──────────────────────────────
  get hiresByHouseHelp(): Map<string, any[]> {
    const e = this.earnings();
    if (!e?.hireRequests?.length) return new Map();
    const map = new Map<string, any[]>();
    for (const hr of e.hireRequests) {
      const key = hr.houseHelpName || `HouseHelp #${hr.houseHelpUserId}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(hr);
    }
    return map;
  }

  get hiresByHouseHelpEntries(): [string, any[]][] {
    return Array.from(this.hiresByHouseHelp.entries());
  }

  ngOnInit(): void {
    const paramAgencyId = this.route.snapshot.paramMap.get('agencyId');

    if (paramAgencyId) {
      this.isAdminView = true;
      this.agencyId = +paramAgencyId;
      this.loadByAgencyId(this.agencyId);
    } else if (this.isAdmin()) {
      // Admin with no specific agency: show all agencies list
      this.showAdminList = true;
      this.loading.set(false);
      this.loadAllAgencies();
    } else {
      // Agent: show only their own connected agency
      this.service.getMyAgency().subscribe({
        next: (ag) => {
          this.agency.set(ag);
          this.agencyId = ag.id;
          this.loadPortalData(ag.id);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  private loadByAgencyId(id: number): void {
    this.service.getAgency(id).subscribe({
      next: (ag) => {
        this.agency.set(ag);
        this.loadPortalData(id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadPortalData(agencyId: number): void {
    let pending = 2;
    const done = () => { if (--pending === 0) this.loading.set(false); };

    this.service.getEarnings(agencyId).subscribe({
      next: (e) => { this.earnings.set(e); done(); },
      error: () => done(),
    });

    this.service.getHouseHelps(agencyId).subscribe({
      next: (hh) => { this.houseHelps.set(hh); done(); },
      error: () => done(),
    });
  }

  refreshEarnings(): void {
    if (!this.agencyId) return;
    this.service.getEarnings(this.agencyId).subscribe({
      next: (e) => this.earnings.set(e),
    });
  }

  // ── admin agencies list ─────────────────────────────

  loadAllAgencies(): void {
    this.service.getAllAgencies().subscribe({
      next: (page) => this.allAgencies.set(page.content),
    });
  }

  viewAgency(id: number): void {
    this.router.navigate(['/dashboard/agency', id]);
  }

  submitCreateAgency(): void {
    if (!this.createData.name.trim()) {
      this.createError = 'Agency name is required';
      return;
    }
    this.createError = '';
    this.createSubmitting = true;
    this.service.createAgency(this.createData).subscribe({
      next: (created) => {
        this.createSubmitting = false;
        this.showCreateForm = false;
        this.createData = { name: '', phoneNumber: '', email: '', locationOfOperation: '', homeLocation: '', houseNumber: '' };
        this.snackBar.open('Agency created', 'OK', { duration: 3000 });
        this.allAgencies.update(list => [created, ...list]);
      },
      error: (err) => {
        this.createSubmitting = false;
        this.createError = err?.error?.message || 'Failed to create agency';
      },
    });
  }

  // ── permissions ─────────────────────────────────────

  /** Can manage team (add/remove househelps and members) */
  canManageTeam(): boolean {
    if (this.isAdmin()) return true;
    if (this.isAdminView) return false;
    const role = this.myMemberRole();
    return role === 'ADMIN' || role == null;
  }

  /** Can request withdrawal (only own account, only ADMIN role members) */
  canRequestWithdrawal(): boolean {
    if (this.isAdminView) return false;
    const role = this.myMemberRole();
    return role === 'ADMIN' || role == null;
  }

  // ── add member ──────────────────────────────────────

  searchMembers(): void {
    if (!this.memberSearchQuery.trim()) return;
    this.memberSearchLoading = true;
    this.memberSearchError = '';
    this.memberSearchResults = [];
    this.selectedMemberUser = null;
    this.service.lookupUsers(this.memberSearchQuery.trim()).subscribe({
      next: (results) => {
        this.memberSearchLoading = false;
        this.memberSearchResults = results;
        if (!results.length) this.memberSearchError = 'No users found';
      },
      error: () => {
        this.memberSearchLoading = false;
        this.memberSearchError = 'Search failed. Try again.';
      }
    });
  }

  selectMemberUser(user: any): void {
    this.selectedMemberUser = user;
    this.memberSearchResults = [];
    this.addMemberError = '';
  }

  addMember(): void {
    if (!this.selectedMemberUser?.phoneNumber) {
      this.addMemberError = 'Search and select a user first';
      return;
    }
    if (!this.agencyId) return;

    this.addMemberError = '';
    this.addMemberSubmitting = true;

    this.service.addMember(this.agencyId, this.selectedMemberUser.phoneNumber, this.newMemberRole).subscribe({
      next: (updated) => {
        this.addMemberSubmitting = false;
        this.showAddMemberForm = false;
        this.memberSearchQuery = '';
        this.selectedMemberUser = null;
        this.newMemberRole = 'ADMIN';
        this.agency.set(updated);
        this.snackBar.open('Member added to agency', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.addMemberSubmitting = false;
        this.addMemberError = err?.error || 'Failed to add member. Ensure they have ROLE_AGENT.';
      },
    });
  }

  removeMember(agentId: number, name: string): void {
    if (!this.agencyId) return;
    this.service.removeMember(this.agencyId, agentId).subscribe({
      next: () => {
        const current = this.agency();
        if (current) {
          this.agency.set({ ...current, members: current.members.filter(m => m.id !== agentId) });
        }
        this.snackBar.open(`${name} removed from agency`, 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to remove member', 'Close', { duration: 3000 }),
    });
  }

  // ── add househelp ───────────────────────────────────

  addHouseHelp(): void {
    const { name, phoneNumber, password } = this.newHouseHelp;
    if (!name.trim() || !phoneNumber.trim() || !password.trim()) {
      this.addHouseHelpError = 'Name, phone, and password are required';
      return;
    }
    if (!this.agencyId) return;

    this.addHouseHelpError = '';
    this.addHouseHelpSubmitting = true;

    const payload: any = { name: name.trim(), phoneNumber: phoneNumber.trim(), password };
    if (this.newHouseHelp.email.trim()) payload.email = this.newHouseHelp.email.trim();

    this.service.registerHouseHelp(this.agencyId, payload).subscribe({
      next: () => {
        this.addHouseHelpSubmitting = false;
        this.showAddHouseHelpForm = false;
        this.newHouseHelp = { name: '', phoneNumber: '', email: '', password: '' };
        this.snackBar.open('Househelp registered and added to agency', 'OK', { duration: 4000 });
        this.service.getHouseHelps(this.agencyId!).subscribe({
          next: (hh) => this.houseHelps.set(hh),
        });
      },
      error: (err) => {
        this.addHouseHelpSubmitting = false;
        this.addHouseHelpError = err?.error || 'Registration failed. Please try again.';
      },
    });
  }

  // ── withdrawal ──────────────────────────────────────

  submitWithdrawal(): void {
    const amount = parseFloat(this.withdrawalAmount);
    if (!amount || amount <= 0) {
      this.withdrawalError = 'Enter a valid amount greater than 0';
      return;
    }
    if (!this.withdrawalPhone.trim()) {
      this.withdrawalError = 'Enter your M-Pesa phone number';
      return;
    }
    const balance = this.earnings()?.balanceRemaining ?? 0;
    if (amount > balance) {
      this.withdrawalError = `Amount exceeds available balance of KES ${balance}`;
      return;
    }

    this.withdrawalError = '';
    this.withdrawalSubmitting = true;

    this.service.requestWithdrawal(this.agencyId!, amount, this.withdrawalPhone.trim(), this.withdrawalNotes || undefined).subscribe({
      next: () => {
        this.withdrawalSubmitting = false;
        this.showWithdrawalForm = false;
        this.withdrawalAmount = '';
        this.withdrawalPhone = '';
        this.withdrawalNotes = '';
        this.snackBar.open('Withdrawal request submitted. YayaConnect will process it shortly.', 'OK', { duration: 5000 });
        this.refreshEarnings();
      },
      error: (err) => {
        this.withdrawalSubmitting = false;
        this.withdrawalError = err?.error || 'Request failed. Please try again.';
      },
    });
  }

  // ── edit agency ─────────────────────────────────────

  openEditForm(): void {
    const ag = this.agency();
    this.editData = {
      name: ag?.name,
      phoneNumber: ag?.phoneNumber,
      email: ag?.email,
      locationOfOperation: ag?.locationOfOperation,
      homeLocation: ag?.homeLocation,
      houseNumber: ag?.houseNumber,
    };
    this.showEditForm = true;
  }

  saveAgency(): void {
    if (!this.agencyId) return;
    this.service.updateAgency(this.agencyId, this.editData).subscribe({
      next: (updated) => {
        this.showEditForm = false;
        this.agency.set(updated);
        this.snackBar.open('Agency updated', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update agency', 'Close', { duration: 3000 }),
    });
  }

  // ── helpers ─────────────────────────────────────────

  navigateToAccount(userId: number | undefined): void {
    if (userId) this.router.navigate(['/account', userId]);
  }

  statusClass(status: string): string {
    if (status === 'ACCEPTED' || status === 'PAID') return 'status-badge--active';
    if (status === 'REJECTED') return 'status-badge--inactive';
    return 'status-badge--pending';
  }
}
