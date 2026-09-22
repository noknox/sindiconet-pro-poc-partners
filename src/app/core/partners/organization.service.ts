import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PARTNER_CONFIG } from '../config/partner.config';
import {
  OrganizationRequest,
  OrganizationResponse,
  PaginatedResult
} from './partner.types';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PARTNER_CONFIG);

  private get baseUrl(): string {
    return `${this.config.apiBaseUrl}/api/partner/organizations`;
  }

  list(page: number, pageSize: number): Observable<PaginatedResult<OrganizationResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PaginatedResult<OrganizationResponse>>(this.baseUrl, { params });
  }

  getById(externalId: string): Observable<OrganizationResponse> {
    return this.http.get<OrganizationResponse>(`${this.baseUrl}/${externalId}`);
  }

  create(payload: OrganizationRequest): Observable<OrganizationResponse> {
    return this.http.post<OrganizationResponse>(this.baseUrl, payload);
  }

  update(externalId: string, payload: OrganizationRequest): Observable<OrganizationResponse> {
    return this.http.put<OrganizationResponse>(`${this.baseUrl}/${externalId}`, payload);
  }

  delete(externalId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${externalId}`);
  }
}
