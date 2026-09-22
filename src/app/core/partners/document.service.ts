import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PARTNER_CONFIG } from '../config/partner.config';
import {
  DocumentResponse,
  DocumentUpdateRequest,
  PaginatedResult
} from './partner.types';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(PARTNER_CONFIG);

  private url(organizationId: string, condominiumId: string): string {
    return `${this.config.apiBaseUrl}/api/partner/organization/${organizationId}/condominium/${condominiumId}/documents`;
  }

  listByCondominium(
    organizationId: string,
    condominiumId: string,
    page: number,
    pageSize: number
  ): Observable<PaginatedResult<DocumentResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PaginatedResult<DocumentResponse>>(
      this.url(organizationId, condominiumId),
      { params }
    );
  }

  getById(organizationId: string, condominiumId: string, documentId: string): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.url(organizationId, condominiumId)}/${documentId}`);
  }

  upload(
    organizationId: string,
    condominiumId: string,
    file: File,
    name?: string
  ): Observable<DocumentResponse> {
    const formData = new FormData();
    if (name) {
      formData.append('name', name);
    }
    formData.append('file', file, file.name);

    return this.http.post<DocumentResponse>(this.url(organizationId, condominiumId), formData);
  }

  bulkUpload(
    organizationId: string,
    condominiumId: string,
    files: File[]
  ): Observable<DocumentResponse[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    return this.http.post<DocumentResponse[]>(`${this.url(organizationId, condominiumId)}/bulk`, formData);
  }

  update(
    organizationId: string,
    condominiumId: string,
    documentId: string,
    payload: DocumentUpdateRequest
  ): Observable<DocumentResponse> {
    return this.http.put<DocumentResponse>(
      `${this.url(organizationId, condominiumId)}/${documentId}`,
      payload
    );
  }

  delete(organizationId: string, condominiumId: string, documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(organizationId, condominiumId)}/${documentId}`);
  }
}
