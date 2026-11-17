import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { PARTNER_CONFIG } from '../config/partner.config';

interface KeycloakTokenResponse {
  access_token: string;
  expires_in: number;
}

// Renova 30 s antes de vencer, para o token não expirar no meio de uma chamada.
const EXPIRY_MARGIN_MS = 30_000;

// Token do parceiro no Keycloak (client_credentials), reaproveitado até perto de vencer.
// Em produção isso roda no backend do parceiro: o client secret não pode ir para o browser.
@Injectable({ providedIn: 'root' })
export class PartnerTokenService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PARTNER_CONFIG);

  private token: string | null = null;
  private expiresAt = 0;
  private pending: Observable<string> | null = null;

  getToken(): Observable<string> {
    if (this.token && Date.now() < this.expiresAt) return of(this.token);

    // Chamadas simultâneas esperam o mesmo pedido ao Keycloak.
    this.pending ??= this.requestToken().pipe(
      finalize(() => (this.pending = null)),
      shareReplay(1)
    );

    return this.pending;
  }

  private requestToken(): Observable<string> {
    const body = new HttpParams()
      .set('grant_type', 'client_credentials')
      .set('client_id', this.config.clientId)
      .set('client_secret', this.config.clientSecret);

    return this.http.post<KeycloakTokenResponse>(this.config.tokenUrl!, body).pipe(
      tap(({ access_token, expires_in }) => {
        this.token = access_token;
        this.expiresAt = Date.now() + expires_in * 1000 - EXPIRY_MARGIN_MS;
      }),
      map(({ access_token }) => access_token)
    );
  }
}
