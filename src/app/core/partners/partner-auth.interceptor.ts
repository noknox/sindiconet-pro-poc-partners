import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { PARTNER_CONFIG } from '../config/partner.config';
import { PartnerTokenService } from './partner-token.service';

export const partnerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(PARTNER_CONFIG);
  const tokens = inject(PartnerTokenService);

  if (!req.url.includes('/api/partner/')) {
    return next(req);
  }

  // Keycloak: token do realm de parceiros (client_credentials) como Bearer.
  if (config.tokenUrl) {
    return tokens.getToken().pipe(
      switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
    );
  }

  // Legado: credenciais geradas pela dashboard do SindicoNet.
  const authReq = req.clone({
    setHeaders: {
      'X-Client-Id': config.clientId,
      'X-Client-Secret': config.clientSecret
    }
  });

  return next(authReq);
};
