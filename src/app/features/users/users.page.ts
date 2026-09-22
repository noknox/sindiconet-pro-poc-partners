import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  PaginatedResult,
  UserRequest,
  UserResponse,
  UserUpdateRequest
} from '../../core/partners/partner.types';
import { UserService } from '../../core/partners/user.service';
import { SyncStateService } from '../../core/partners/sync-state.service';
import { CrudService } from '../../core/partners/crud.service';
import { PartnerErrorComponent } from '../../shared/partner-error/partner-error.component';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [FormsModule, PartnerErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.css']
})
export class UsersPage implements OnInit {
  private readonly service = inject(UserService);
  private readonly state = inject(SyncStateService);
  private readonly crud = inject(CrudService);
  private readonly route = inject(ActivatedRoute);

  readonly items = signal<UserResponse[]>([]);
  readonly form = signal<UserRequest>(this.emptyForm());
  readonly editingId = signal<string | null>(null);
  readonly loading = this.crud.loading;
  readonly error = this.crud.error;
  readonly reason = signal<string | null>(this.route.snapshot.queryParamMap.get('reason'));

  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly hasContext = this.state.hasOrganization;
  readonly currentOrgName = computed(() => this.state.organizationName());

  private lastOrgId: string | null = null;

  constructor() {
    // Reset pagination when the active organization changes.
    effect(() => {
      const orgId = this.state.organizationId();
      if (orgId !== this.lastOrgId) {
        this.page.set(1);
        this.items.set([]);
        this.totalItems.set(0);
        this.totalPages.set(0);
      }
    });
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const orgId = this.state.organizationId();
    this.lastOrgId = orgId;
    if (!orgId) {
      this.items.set([]);
      this.totalItems.set(0);
      this.totalPages.set(0);
      return;
    }
    this.crud
      .run<PaginatedResult<UserResponse>>(() =>
        this.service.listByOrganization(orgId, this.page(), this.pageSize())
      )
      .subscribe((res) => {
        this.items.set(res?.items ?? []);
        this.page.set(res?.page ?? this.page());
        this.pageSize.set(res?.pageSize ?? this.pageSize());
        this.totalItems.set(res?.totalItems ?? 0);
        this.totalPages.set(res?.totalPages ?? 0);
      });
  }

  startEdit(item: UserResponse): void {
    this.editingId.set(item.userId);
    this.form.set({
      name: item.name,
      email: item.email,
      cpf: item.cpf ?? '',
      role: item.role
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.set(this.emptyForm());
  }

  selectContext(item: UserResponse): void {
    this.state.setUser(item.userId, item.email);
  }

  isContext(item: UserResponse): boolean {
    return this.state.userId() === item.userId;
  }

  updateField<K extends keyof UserRequest>(
    key: K,
    value: UserRequest[K]
  ): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  updateRoleText(value: string): void {
    if (value === '') {
      this.form.update((f) => ({ ...f, role: null }));
      return;
    }
    const parsed = Number(value);
    this.form.update((f) => ({
      ...f,
      role: Number.isNaN(parsed) ? null : (parsed as UserRequest['role'])
    }));
  }

  goToPage(target: number): void {
    const max = this.totalPages();
    const clamped = max === 0 ? 1 : Math.min(Math.max(target, 1), max);
    if (clamped === this.page()) return;
    this.page.set(clamped);
    this.refresh();
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  prevPage(): void {
    this.goToPage(this.page() - 1);
  }

  changePageSize(size: number): void {
    if (size <= 0 || size === this.pageSize()) return;
    this.pageSize.set(size);
    this.page.set(1);
    this.refresh();
  }

  submit(): void {
    const orgId = this.state.organizationId();
    if (!orgId) {
      return;
    }

    const f = this.form();
    const editing = this.editingId();
    if (editing) {
      const updatePayload: UserUpdateRequest = {
        name: f.name,
        role: f.role ?? null
      };
      this.crud
        .run<UserResponse>(() => this.service.update(orgId, editing, updatePayload))
        .subscribe({
          next: () => {
            this.cancelEdit();
            this.refresh();
          }
        });
    } else {
      this.crud
        .run<UserResponse>(() => this.service.create(orgId, f))
        .subscribe({
          next: () => {
            this.cancelEdit();
            this.refresh();
          }
        });
    }
  }

  remove(item: UserResponse): void {
    const orgId = this.state.organizationId();
    if (!orgId) {
      return;
    }
    if (!confirm(`Excluir o usuário "${item.name}"?`)) return;
    if (this.isContext(item)) this.state.setUser('', '');
    this.crud
      .run<void>(() => this.service.delete(orgId, item.userId))
      .subscribe({
        next: () => {
          if (this.items().length === 1 && this.page() > 1) {
            this.page.set(this.page() - 1);
          }
          this.refresh();
        }
      });
  }

  roleAsText(role: number): string {
    return String(role);
  }

  private emptyForm(): UserRequest {
    return {
      name: '',
      email: '',
      cpf: '',
      role: null
    };
  }
}
