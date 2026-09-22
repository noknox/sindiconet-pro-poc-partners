import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PARTNER_CONFIG } from '../config/partner.config';
import {
  CondominiumRequest,
  CondominiumResponse,
  PaginatedResult
} from './partner.types';

@Injectable({ providedIn: 'root' })
export class CondominiumService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PARTNER_CONFIG);

  private url(organizationId: string): string {
    return `${this.config.apiBaseUrl}/api/partner/organization/${organizationId}/condominiums`;
  }

  listByOrganization(
    organizationId: string,
    page: number,
    pageSize: number
  ): Observable<PaginatedResult<CondominiumResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PaginatedResult<CondominiumResponse>>(
      this.url(organizationId),
      { params }
    );
  }

  getById(organizationId: string, condominiumId: string): Observable<CondominiumResponse> {
    return this.http.get<CondominiumResponse>(`${this.url(organizationId)}/${condominiumId}`);
  }

  create(organizationId: string, payload: CondominiumRequest): Observable<CondominiumResponse> {
    return this.http.post<CondominiumResponse>(this.url(organizationId), payload);
  }

  update(
    organizationId: string,
    condominiumId: string,
    payload: CondominiumRequest
  ): Observable<CondominiumResponse> {
    return this.http.put<CondominiumResponse>(`${this.url(organizationId)}/${condominiumId}`, payload);
  }

  delete(organizationId: string, condominiumId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(organizationId)}/${condominiumId}`);
  }
}
