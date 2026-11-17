import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CondominiumService } from '../../core/partners/condominium.service';
import { CondominiumResponse } from '../../core/partners/partner.types';
import { SyncStateService } from '../../core/partners/sync-state.service';

interface MenuItem {
  label: string;
  route: string;
  requiresOrg?: boolean;
  requiresCondo?: boolean;
  requiresUser?: boolean;
  disabledHint?: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  private readonly state = inject(SyncStateService);
  private readonly condominiumService = inject(CondominiumService);
  private readonly router = inject(Router);

  readonly items: MenuItem[] = [
    { label: 'SindicoNet IA', route: '/sindiconet-ia', requiresUser: true, disabledHint: 'Selecione um usuário antes' },
    { label: 'Organizações', route: '/organizations' },
    { label: 'Usuários', route: '/users', requiresOrg: true },
    { label: 'Condomínios', route: '/condominiums', requiresOrg: true },
    { label: 'Documentos', route: '/documents', requiresCondo: true }
  ];

  readonly organizationName = this.state.organizationName;
  readonly userEmail = this.state.userEmail;

  // Condomínio do ERP: trocar aqui repassa a seleção ao iframe do SindicoNet IA (via postMessage)
  readonly condominiums = signal<CondominiumResponse[]>([]);
  readonly condominiumId = this.state.condominiumId;
  readonly condominiumName = this.state.condominiumName;
  readonly hasOrganization = this.state.hasOrganization;

  readonly syncStatus = computed(() => {
    switch (this.state.condominiumApplied()) {
      case true: return 'Aplicado no SindicoNet IA';
      case false: return 'Não encontrado para este usuário no SindicoNet IA';
      default: return null;
    }
  });

  constructor() {
    effect(() => this.loadCondominiums(this.state.organizationId()), { allowSignalWrites: true });

    // Recarrega a lista ao navegar, para refletir condomínios criados/removidos na tela Condomínios
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.loadCondominiums(this.state.organizationId()));
  }

  isDisabled(item: MenuItem): boolean {
    if (item.requiresUser) return !this.state.hasUser();
    if (item.requiresCondo) return !this.state.hasCondominium();
    if (item.requiresOrg) return !this.state.hasOrganization();
    return false;
  }

  onSelectCondominium(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const condo = this.condominiums().find((c) => c.condominiumId === id);
    if (!condo) return;

    this.state.setCondominium(condo.condominiumId, condo.name);
  }

  private loadCondominiums(organizationId: string | null): void {
    if (!organizationId) {
      this.condominiums.set([]);
      return;
    }

    this.condominiumService
      .listByOrganization(organizationId, 1, 100)
      .subscribe({
        next: (res) => this.condominiums.set(res?.items ?? []),
        error: () => this.condominiums.set([])
      });
  }
}
