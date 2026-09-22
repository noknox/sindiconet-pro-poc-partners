import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SyncStateService } from '../../core/partners/sync-state.service';

interface MenuItem {
  label: string;
  route: string;
  requiresOrg?: boolean;
  requiresCondo?: boolean;
  requiresUser?: boolean;
  disabledHint?: string;
}

interface ContextLevel {
  label: string;
  value: string;
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

  readonly items: MenuItem[] = [
    { label: 'SindicoNet IA', route: '/sindiconet-ia', requiresUser: true, disabledHint: 'Selecione um usuário antes' },
    { label: 'Organizações', route: '/organizations' },
    { label: 'Usuários', route: '/users', requiresOrg: true },
    { label: 'Condomínios', route: '/condominiums', requiresOrg: true },
    { label: 'Documentos', route: '/documents', requiresCondo: true }
  ];

  readonly contextLevels = computed<ContextLevel[]>(() => [
    { label: 'Organização', value: this.state.organizationName() ?? '—' },
    { label: 'Condomínio', value: this.state.condominiumName() ?? '—' },
    { label: 'Usuário', value: this.state.userEmail() ?? '—' }
  ]);

  isDisabled(item: MenuItem): boolean {
    if (item.requiresUser) return !this.state.hasUser();
    if (item.requiresCondo) return !this.state.hasCondominium();
    if (item.requiresOrg) return !this.state.hasOrganization();
    return false;
  }
}