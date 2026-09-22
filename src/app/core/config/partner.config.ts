import { InjectionToken } from '@angular/core';

export interface PartnerConfig {
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  iframeUrl: string;
}

export const PARTNER_CONFIG = new InjectionToken<PartnerConfig>('PARTNER_CONFIG');
