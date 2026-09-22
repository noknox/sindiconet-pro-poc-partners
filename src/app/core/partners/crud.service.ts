import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { PartnerError } from './partner.types';

@Injectable({ providedIn: 'root' })
export class CrudService {
  readonly loading = signal(false);
  readonly error = signal<PartnerError | null>(null);

  run<T>(
    work: () => Observable<T>,
    options: { suppressLoading?: boolean } = {}
  ): Observable<T> {
    if (!options.suppressLoading) this.loading.set(true);
    this.error.set(null);
    return work().pipe(
      tap(() => {
        if (!options.suppressLoading) this.loading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        if (!options.suppressLoading) this.loading.set(false);
        this.error.set(toPartnerError(err));
        return throwError(() => err);
      })
    );
  }
}

export function toPartnerError(err: HttpErrorResponse): PartnerError {
  if (err.error?.errors?.length) {
    return err.error as PartnerError;
  }
  const message =
    typeof err.error === 'string'
      ? err.error
      : err.message || `Erro ${err.status}`;
  return { errors: [{ code: `HTTP_${err.status || 0}`, message }] };
}
