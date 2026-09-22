import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CondominiumRequest,
  CondominiumResponse,
  PaginatedResult
} from '../../core/partners/partner.types';
import { CondominiumService } from '../../core/partners/condominium.service';
import { SyncStateService } from '../../core/partners/sync-state.service';
import { CrudService } from '../../core/partners/crud.service';
import { PartnerErrorComponent } from '../../shared/partner-error/partner-error.component';

@Component({
  selector: 'app-condominiums-page',
  standalone: true,
  imports: [FormsModule, PartnerErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './condominiums.page.html',
  styleUrls: ['./condominiums.page.css']
})
export class CondominiumsPage implements OnInit {
  private readonly service = inject(CondominiumService);
  private readonly state = inject(SyncStateService);
  private readonly crud = inject(CrudService);

  readonly items = signal<CondominiumResponse[]>([]);
  readonly form = signal<CondominiumRequest>(this.emptyForm());
  readonly editingId = signal<string | null>(null);
  readonly loading = this.crud.loading;
  readonly error = this.crud.error;

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
      .run<PaginatedResult<CondominiumResponse>>(() =>
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

  startEdit(item: CondominiumResponse): void {
    this.editingId.set(item.condominiumId);
    this.form.set({
      name: item.name,
      zipCode: item.zipCode,
      buildTypeId: item.buildTypeId ?? null,
      description: item.description ?? '',
      address: item.address ?? '',
      number: item.number ?? '',
      borough: item.borough ?? '',
      cnpj: item.cnpj ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.set(this.emptyForm());
  }

  selectContext(item: CondominiumResponse): void {
    this.state.setCondominium(item.condominiumId, item.name);
  }

  isContext(item: CondominiumResponse): boolean {
    return this.state.condominiumId() === item.condominiumId;
  }

  updateField<K extends keyof CondominiumRequest>(
    key: K,
    value: CondominiumRequest[K]
  ): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  updateBuildTypeText(value: string): void {
    const parsed = value === '' ? null : Number(value);
    this.form.update((f) => ({
      ...f,
      buildTypeId: parsed === null || Number.isNaN(parsed) ? null : parsed
    }));
  }

  buildTypeAsText(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
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
    const f = this.form();
    const orgId = this.state.organizationId();
    if (!orgId) {
      return;
    }

    const editing = this.editingId();
    if (editing) {
      this.crud
        .run<CondominiumResponse>(() => this.service.update(orgId, editing, f))
        .subscribe({
          next: () => {
            this.cancelEdit();
            this.refresh();
          }
        });
    } else {
      this.crud
        .run<CondominiumResponse>(() => this.service.create(orgId, f))
        .subscribe({
          next: (created) => {
            this.cancelEdit();
            this.refresh();
            this.selectContext(created);
          }
        });
    }
  }

  remove(item: CondominiumResponse): void {
    const orgId = this.state.organizationId();
    if (!orgId) {
      return;
    }
    if (!confirm(`Excluir o condomínio "${item.name}"?`)) return;
    if (this.isContext(item)) this.state.setCondominium('', '');
    this.crud
      .run<void>(() => this.service.delete(orgId, item.condominiumId))
      .subscribe({
        next: () => {
          if (this.items().length === 1 && this.page() > 1) {
            this.page.set(this.page() - 1);
          }
          this.refresh();
        }
      });
  }

  private emptyForm(): CondominiumRequest {
    return {
      name: '',
      zipCode: '',
      buildTypeId: null,
      description: '',
      address: '',
      number: '',
      borough: '',
      cnpj: ''
    };
  }
}
