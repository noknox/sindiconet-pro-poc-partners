import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-auth-error-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-error">
      <h2>Não foi possível autenticar no SindicoNet IA</h2>
      <p>Verifique a sua conexão, as credenciais do parceiro e a allowlist de origem.</p>
      @if (reason) {
        <p class="reason">Motivo: <code>{{ reason }}</code></p>
      }
    </div>
  `,
  styles: `
    .auth-error {
      max-width: 480px;
      margin: 80px auto;
      padding: 24px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      text-align: center;
      color: #3d3d3d;
      font-family: 'Inter', system-ui, sans-serif;
    }
    h2 { color: #b3261e; margin: 0 0 12px; }
    .reason { font-size: 13px; color: #5c6270; }
  `
})
export class AuthErrorPage {
  private readonly route = inject(ActivatedRoute);
  readonly reason: string | null = this.route.snapshot.queryParamMap.get('reason');
}
