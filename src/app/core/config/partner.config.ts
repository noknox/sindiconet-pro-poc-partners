import { InjectionToken } from '@angular/core';

export interface PartnerConfig {
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  iframeUrl: string;
  // Endpoint de token do Keycloak (realm de parceiros). Preenchido: clientId/clientSecret são do Keycloak e a
  // API recebe Authorization: Bearer. Vazio: clientId/clientSecret legados, enviados em X-Client-Id/X-Client-Secret.
  tokenUrl?: string;
}

export const PARTNER_CONFIG = new InjectionToken<PartnerConfig>('PARTNER_CONFIG');
