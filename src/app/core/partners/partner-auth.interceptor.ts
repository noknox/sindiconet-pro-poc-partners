import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PARTNER_CONFIG } from '../config/partner.config';

export const partnerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(PARTNER_CONFIG);

  if (!req.url.includes('/api/partner/')) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      'X-Client-Id': config.clientId,
      'X-Client-Secret': config.clientSecret
    },
    withCredentials: true
  });

  return next(authReq);
};
