import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PARTNER_CONFIG } from '../config/partner.config';
import { AuthenticateRequest, AuthenticateResponse } from './partner.types';

@Injectable({ providedIn: 'root' })
export class AuthenticateService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PARTNER_CONFIG);

  authenticate(userId: string, email: string): Observable<AuthenticateResponse> {
    const body: AuthenticateRequest = { userId, email };

    return this.http.post<AuthenticateResponse>(
      `${this.config.apiBaseUrl}/api/partner/users/authenticate`,
      body
    );
  }
}