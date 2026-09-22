import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { PARTNER_CONFIG } from './core/config/partner.config';
import { environment } from '../environments/environment';
import { partnerAuthInterceptor } from './core/partners/partner-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([partnerAuthInterceptor])),
    {
      provide: PARTNER_CONFIG,
      useValue: environment.partner
    }
  ]
};