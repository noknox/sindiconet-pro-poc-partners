import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  OrganizationRequest,
  OrganizationResponse,
  PaginatedResult
} from '../../core/partners/partner.types';
import { OrganizationService } from '../../core/partners/organization.service';
import { SyncStateService } from '../../core/partners/sync-state.service';
import { CrudService } from '../../core/partners/crud.service';
import { PartnerErrorComponent } from '../../shared/partner-error/partner-error.component';

@Component({
  selector: 'app-organizations-page',
  standalone: true,
  imports: [FormsModule, PartnerErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.page.html',
  styleUrls: ['./organizations.page.css']
})
export class OrganizationsPage implements OnInit {
  private readonly service = inject(OrganizationService);
  private readonly state = inject(SyncStateService);
  private readonly crud = inject(CrudService);

  readonly items = signal<OrganizationResponse[]>([]);
  readonly form = signal<OrganizationRequest>(this.emptyForm());
  readonly editingId = signal<string | null>(null);
  readonly loading = this.crud.loading;
  readonly error = this.crud.error;

  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly pageSizeOptions = [10, 25, 50, 100];

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.crud
      .run<PaginatedResult<OrganizationResponse>>(() =>
        this.service.list(this.page(), this.pageSize())
      )
      .subscribe((res) => {
        this.items.set(res?.items ?? []);
        this.page.set(res?.page ?? this.page());
        this.pageSize.set(res?.pageSize ?? this.pageSize());
        this.totalItems.set(res?.totalItems ?? 0);
        this.totalPages.set(res?.totalPages ?? 0);
      });
  }

  startEdit(item: OrganizationResponse): void {
    this.editingId.set(item.organizationId);
    this.form.set({
      name: item.name,
      cnpj: item.cnpj ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      zipCode: item.zipCode ?? '',
      address: item.address ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.set(this.emptyForm());
  }

  selectContext(item: OrganizationResponse): void {
    this.state.setOrganization(item.organizationId, item.name);
  }

  isContext(item: OrganizationResponse): boolean {
    return this.state.organizationId() === item.organizationId;
  }

  updateField<K extends keyof OrganizationRequest>(
    key: K,
    value: OrganizationRequest[K]
  ): void {
    this.form.update((f) => ({ ...f, [key]: value }));
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
    const payload = this.form();
    const editing = this.editingId();
    if (editing) {
      this.crud
        .run<OrganizationResponse>(() => this.service.update(editing, payload))
        .subscribe({
          next: () => {
            this.cancelEdit();
            this.refresh();
          }
        });
    } else {
      this.crud
        .run<OrganizationResponse>(() => this.service.create(payload))
        .subscribe({
          next: (created) => {
            this.cancelEdit();
            this.refresh();
            this.selectContext(created);
          }
        });
    }
  }

  remove(item: OrganizationResponse): void {
    if (!confirm(`Excluir a organização "${item.name}"?`)) return;
    if (this.isContext(item)) this.state.reset();
    this.crud
      .run<void>(() => this.service.delete(item.organizationId))
      .subscribe({
        next: () => {
          // If the last item on this page was removed, step back to the previous page.
          if (this.items().length === 1 && this.page() > 1) {
            this.page.set(this.page() - 1);
          }
          this.refresh();
        }
      });
  }

  private emptyForm(): OrganizationRequest {
    return {
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      zipCode: '',
      address: ''
    };
  }
}
