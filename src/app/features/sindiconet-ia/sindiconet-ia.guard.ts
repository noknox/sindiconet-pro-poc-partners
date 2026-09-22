import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthenticateService } from '../../core/partners/authenticate.service';
import { SyncStateService } from '../../core/partners/sync-state.service';

export const sindiconetIaGuard: CanActivateFn = async () => {
  const auth = inject(AuthenticateService);
  const state = inject(SyncStateService);
  const router = inject(Router);

  const userId = state.userId();
  const userEmail = state.userEmail();

  if (!userId || !userEmail) {
    return router.createUrlTree(['/users'], { queryParams: { reason: 'select_user' } });
  }

  try {
    await firstValueFrom(auth.authenticate(userId, userEmail));
    return true;
  } catch (err) {
    const reason = err instanceof HttpErrorResponse && err.status === 401 ? 'auth_failed' : 'network';
    return router.createUrlTree(['/auth-error'], { queryParams: { reason } });
  }
};