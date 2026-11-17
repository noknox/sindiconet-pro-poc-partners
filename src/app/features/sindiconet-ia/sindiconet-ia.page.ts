import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PARTNER_CONFIG } from '../../core/config/partner.config';
import { SyncStateService } from '../../core/partners/sync-state.service';
import { SindiconetIframeComponent } from '../../shared/sindiconet-iframe/sindiconet-iframe.component';

@Component({
  selector: 'app-sindiconet-ia-page',
  standalone: true,
  imports: [SindiconetIframeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="iframe-host">
      <app-sindiconet-iframe [src]="iframeUrl" [condominiumId]="state.condominiumId()" />
    </div>
  `,
  styles: `
    .iframe-host {
      width: 100%;
      height: 100vh;
      background: #f4f5f7;
    }
  `
})
export class SindiconetIaPage {
  private readonly config = inject(PARTNER_CONFIG);
  readonly state = inject(SyncStateService);
  readonly iframeUrl = this.config.iframeUrl;
}
