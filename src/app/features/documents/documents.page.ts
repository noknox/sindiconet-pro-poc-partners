import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CondominiumResponse,
  DocumentResponse,
  DocumentUpdateRequest,
  PaginatedResult
} from '../../core/partners/partner.types';
import { DocumentService } from '../../core/partners/document.service';
import { CondominiumService } from '../../core/partners/condominium.service';
import { SyncStateService } from '../../core/partners/sync-state.service';
import { CrudService } from '../../core/partners/crud.service';
import { PartnerErrorComponent } from '../../shared/partner-error/partner-error.component';

interface UploadFormState {
  name: string;
  files: File[];
}

interface EditState {
  name: string;
  condominiumId: string;
}

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [FormsModule, PartnerErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './documents.page.html',
  styleUrls: ['./documents.page.css']
})
export class DocumentsPage implements OnInit {
  private readonly service = inject(DocumentService);
  private readonly condoService = inject(CondominiumService);
  private readonly state = inject(SyncStateService);
  private readonly crud = inject(CrudService);

  readonly items = signal<DocumentResponse[]>([]);
  readonly form = signal<UploadFormState>({ name: '', files: [] });
  readonly editingId = signal<string | null>(null);
  readonly editForm = signal<EditState>({ name: '', condominiumId: '' });
  readonly condoOptions = signal<CondominiumResponse[]>([]);
  readonly details = signal<DocumentResponse | null>(null);
  readonly loading = this.crud.loading;
  readonly error = this.crud.error;

  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly pageSizeOptions = [10, 25, 50, 100];

  readonly hasOrg = this.state.hasOrganization;
  readonly hasCondo = this.state.hasCondominium;
  readonly currentCondoName = computed(() => this.state.condominiumName());

  private lastContext: { orgId: string | null; condoId: string | null } = {
    orgId: null,
    condoId: null
  };

  constructor() {
    // Reset pagination when organization or condominium context changes.
    effect(() => {
      const orgId = this.state.organizationId();
      const condoId = this.state.condominiumId();
      if (orgId !== this.lastContext.orgId || condoId !== this.lastContext.condoId) {
        this.page.set(1);
        this.items.set([]);
        this.totalItems.set(0);
        this.totalPages.set(0);
      }
    });
  }

  ngOnInit(): void {
    this.refresh();
    this.loadCondoOptions();
  }

  refresh(): void {
    const orgId = this.state.organizationId();
    const condoId = this.state.condominiumId();
    this.lastContext = { orgId, condoId };
    if (!orgId || !condoId) {
      this.items.set([]);
      this.totalItems.set(0);
      this.totalPages.set(0);
      return;
    }
    this.crud
      .run<PaginatedResult<DocumentResponse>>(() =>
        this.service.listByCondominium(orgId, condoId, this.page(), this.pageSize())
      )
      .subscribe((res) => {
        this.items.set(res?.items ?? []);
        this.page.set(res?.page ?? this.page());
        this.pageSize.set(res?.pageSize ?? this.pageSize());
        this.totalItems.set(res?.totalItems ?? 0);
        this.totalPages.set(res?.totalPages ?? 0);
      });
  }

  private loadCondoOptions(): void {
    const orgId = this.state.organizationId();
    if (!orgId) {
      this.condoOptions.set([]);
      return;
    }
    this.crud
      .run<PaginatedResult<CondominiumResponse>>(() =>
        this.condoService.listByOrganization(orgId, 1, 100)
      )
      .subscribe((res) => this.condoOptions.set(res?.items ?? []));
  }

  updateName(name: string): void {
    this.form.update((f) => ({ ...f, name }));
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];
    this.form.update((f) => ({ ...f, files: list }));
  }

  cancel(): void {
    this.form.set({ name: '', files: [] });
  }

  submit(): void {
    const f = this.form();
    const orgId = this.state.organizationId();
    const condoId = this.state.condominiumId();
    if (!orgId || !condoId || f.files.length === 0) {
      return;
    }
    const name = f.name || undefined;

    if (f.files.length === 1) {
      this.crud
        .run<DocumentResponse>(() => this.service.upload(orgId, condoId, f.files[0], name))
        .subscribe({
          next: () => {
            this.cancel();
            this.refresh();
          }
        });
    } else {
      this.crud
        .run<DocumentResponse[]>(() => this.service.bulkUpload(orgId, condoId, f.files))
        .subscribe({
          next: () => {
            this.cancel();
            this.refresh();
          }
        });
    }
  }

  showDetails(item: DocumentResponse): void {
    const orgId = this.state.organizationId();
    const condoId = this.state.condominiumId();
    if (!orgId || !condoId) {
      return;
    }
    this.details.set(null);
    this.crud
      .run<DocumentResponse>(() => this.service.getById(orgId, condoId, item.documentId))
      .subscribe((res) => this.details.set(res ?? null));
  }

  closeDetails(): void {
    this.details.set(null);
  }

  startEdit(item: DocumentResponse): void {
    this.editingId.set(item.documentId);
    this.editForm.set({ name: item.name, condominiumId: item.condominiumId });
    if (this.condoOptions().length === 0) {
      this.loadCondoOptions();
    }
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.set({ name: '', condominiumId: '' });
  }

  updateEditField<K extends keyof EditState>(key: K, value: EditState[K]): void {
    this.editForm.update((f) => ({ ...f, [key]: value }));
  }

  saveEdit(item: DocumentResponse): void {
    const orgId = this.state.organizationId();
    const condoId = this.state.condominiumId();
    if (!orgId || !condoId) {
      return;
    }

    const f = this.editForm();
    const payload: DocumentUpdateRequest = {};
    if (f.name !== item.name) payload.name = f.name;
    if (f.condominiumId !== item.condominiumId) payload.condominiumId = f.condominiumId;

    if (Object.keys(payload).length === 0) {
      this.cancelEdit();
      return;
    }

    this.crud
      .run<DocumentResponse>(() => this.service.update(orgId, condoId, item.documentId, payload))
      .subscribe({
        next: () => {
          this.cancelEdit();
          this.refresh();
        }
      });
  }

  remove(item: DocumentResponse): void {
    const orgId = this.state.organizationId();
    const condoId = this.state.condominiumId();
    if (!orgId || !condoId) {
      return;
    }
    if (!confirm(`Excluir o documento "${item.name}"?`)) return;
    this.crud.run<void>(() => this.service.delete(orgId, condoId, item.documentId)).subscribe({
      next: () => {
        if (this.editingId() === item.documentId) this.cancelEdit();
        if (this.details()?.documentId === item.documentId) this.details.set(null);
        if (this.items().length === 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }
        this.refresh();
      }
    });
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

  condoNameById(id: string): string {
    return this.condoOptions().find((c) => c.condominiumId === id)?.name ?? id;
  }
}
