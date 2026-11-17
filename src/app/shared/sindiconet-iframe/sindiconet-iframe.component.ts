import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthenticateService } from '../../core/partners/authenticate.service';
import { SyncStateService } from '../../core/partners/sync-state.service';

// Autenticação do usuário no iframe: o SindicoNet IA avisa que está pronto ou pede um token novo
// (quando o atual vence), e o parceiro responde com o token do POST api/partner/users/authenticate.
const EMBED_READY_MESSAGE = 'sindiconet:embed-ready';
const TOKEN_REQUEST_MESSAGE = 'sindiconet:token-request';
const AUTH_TOKEN_MESSAGE = 'sindiconet:auth-token';

// Mensagem que o SindicoNet IA escuta para trocar o condomínio ativo
const SELECT_CONDOMINIUM_MESSAGE = 'sindiconet:select-condominium';

// Resposta do SindicoNet IA após aplicar (ou não encontrar) o condomínio
const CONDOMINIUM_SELECTED_MESSAGE = 'sindiconet:condominium-selected';

@Component({
  selector: 'app-sindiconet-iframe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iframe
      #frame
      [src]="safeUrl()"
      (load)="onLoad()"
      style="width:100%;height:100%;border:none;display:block"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
      allow="clipboard-write"
      referrerpolicy="strict-origin-when-cross-origin"
      title="SindicoNet IA"
    ></iframe>
  `,
  styles: `
    :host { display:block; width:100%; height:100%; }
  `,
  host: { '(window:message)': 'onMessage($event)' }
})
export class SindiconetIframeComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly auth = inject(AuthenticateService);
  private readonly state = inject(SyncStateService);
  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');
  private loaded = false;

  readonly src = input.required<string>();

  // condominiumId (Guid) retornado pela API Partners. O valor inicial vai na URL do iframe;
  // as trocas seguintes são enviadas por postMessage, sem recarregar o iframe.
  readonly condominiumId = input<string | null>(null);

  readonly safeUrl = computed<SafeResourceUrl>(() => {
    const url = new URL(this.src());
    const condominiumId = untracked(this.condominiumId);

    if (condominiumId) url.searchParams.set('condominiumId', condominiumId);

    return this.sanitizer.bypassSecurityTrustResourceUrl(url.toString());
  });

  constructor() {
    effect(() => {
      const condominiumId = this.condominiumId();
      if (this.loaded && condominiumId) this.postCondominium(condominiumId);
    });
  }

  onLoad(): void {
    this.loaded = true;
  }

  onMessage(event: MessageEvent): void {
    if (event.source !== this.frame().nativeElement.contentWindow || event.origin !== this.targetOrigin()) return;

    const token = this.state.userToken();

    switch (event.data?.type) {
      case EMBED_READY_MESSAGE:
        if (token) this.postToken(token);
        break;

      case TOKEN_REQUEST_MESSAGE:
        this.refreshToken();
        break;

      // Ignora a resposta de uma troca anterior que chegue depois da seleção atual
      case CONDOMINIUM_SELECTED_MESSAGE:
        if (event.data.condominiumId === this.condominiumId()) this.state.setCondominiumApplied(event.data.success === true);
        break;
    }
  }

  // O iframe pede token quando não tem nenhum ou quando o atual foi recusado (401): sempre gera outro.
  private refreshToken(): void {
    const userId = this.state.userId();
    const email = this.state.userEmail();

    if (!userId || !email) return;

    this.auth.authenticate(userId, email).subscribe({
      next: ({ accessToken }) => {
        this.state.setUserToken(accessToken);
        this.postToken(accessToken);
      },
      error: (err) => console.error('[poc] falha ao gerar o token do usuário', err)
    });
  }

  private postToken(token: string): void {
    this.post({ type: AUTH_TOKEN_MESSAGE, token });
  }

  private postCondominium(condominiumId: string): void {
    this.post({ type: SELECT_CONDOMINIUM_MESSAGE, condominiumId });
  }

  private post(message: object): void {
    this.frame().nativeElement.contentWindow?.postMessage(message, this.targetOrigin());
  }

  private targetOrigin(): string {
    return new URL(this.src()).origin;
  }
}
