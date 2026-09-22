import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PARTNER_CONFIG } from '../config/partner.config';
import {
  PaginatedResult,
  UserRequest,
  UserResponse,
  UserUpdateRequest
} from './partner.types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PARTNER_CONFIG);

  private url(organizationId: string): string {
    return `${this.config.apiBaseUrl}/api/partner/organization/${organizationId}/users`;
  }

  listByOrganization(
    organizationId: string,
    page: number,
    pageSize: number
  ): Observable<PaginatedResult<UserResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PaginatedResult<UserResponse>>(this.url(organizationId), { params });
  }

  getById(organizationId: string, userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.url(organizationId)}/${userId}`);
  }

  create(organizationId: string, payload: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.url(organizationId), payload);
  }

  update(
    organizationId: string,
    userId: string,
    payload: UserUpdateRequest
  ): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.url(organizationId)}/${userId}`, payload);
  }

  delete(organizationId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(organizationId)}/${userId}`);
  }
}
